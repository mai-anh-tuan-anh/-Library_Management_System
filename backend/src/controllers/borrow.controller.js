const { query, callProcedure, transaction } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { paginateResults } = require('../utils/helpers');

// Get all borrow transactions
const getAllBorrowings = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, reader_id, barcode } = req.query;
    const { offset, limit: pageSize } = paginateResults(page, limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
        whereClause += ` AND bt.status = ?`;
        params.push(status);
    }

    if (reader_id) {
        whereClause += ` AND bt.reader_id = ?`;
        params.push(reader_id);
    }

    if (barcode) {
        whereClause += ` AND bc.barcode = ?`;
        params.push(barcode);
    }

    // Get total count
    const [countResult] = await query(
        `SELECT COUNT(DISTINCT bt.transaction_id) as total 
     FROM borrow_transactions bt
     LEFT JOIN borrow_details bd ON bt.transaction_id = bd.transaction_id
     LEFT JOIN book_copies bc ON bd.copy_id = bc.copy_id
     ${whereClause}`,
        params
    );

    // Get transactions with details
    const transactions = await query(
        `SELECT bt.*, r.full_name as reader_name, r.card_number, r.phone,
            GROUP_CONCAT(DISTINCT b.title SEPARATOR '; ') as book_titles,
            COUNT(DISTINCT bd.detail_id) as book_count
     FROM borrow_transactions bt
     JOIN readers r ON bt.reader_id = r.reader_id
     LEFT JOIN borrow_details bd ON bt.transaction_id = bd.transaction_id
     LEFT JOIN book_copies bc ON bd.copy_id = bc.copy_id
     LEFT JOIN books b ON bc.book_id = b.book_id
     ${whereClause}
     GROUP BY bt.transaction_id
     ORDER BY bt.created_at DESC
     LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
    );

    res.json({
        success: true,
        data: transactions,
        pagination: {
            page: parseInt(page),
            limit: pageSize,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / pageSize)
        }
    });
});

// Get transaction by ID
const getBorrowingById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const transactions = await query(
        `SELECT bt.*, r.full_name as reader_name, r.card_number, r.phone, r.email
     FROM borrow_transactions bt
     JOIN readers r ON bt.reader_id = r.reader_id
     WHERE bt.transaction_id = ?`,
        [id]
    );

    if (transactions.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Transaction not found'
        });
    }

    const details = await query(
        `SELECT bd.*, b.title, b.price, bc.barcode
     FROM borrow_details bd
     JOIN books b ON bd.book_id = b.book_id
     JOIN book_copies bc ON bd.copy_id = bc.copy_id
     WHERE bd.transaction_id = ?`,
        [id]
    );

    res.json({
        success: true,
        data: {
            ...transactions[0],
            details
        }
    });
});

// Create borrowing (step 1: create transaction)
const createBorrowing = asyncHandler(async (req, res) => {
    const { reader_id, payment_method_id, notes, items } = req.body;

    // Check if reader can borrow
    const canBorrow = await query(
        'SELECT can_reader_borrow(?, 1) as can_borrow',
        [reader_id]
    );

    if (!canBorrow[0].can_borrow) {
        return res.status(400).json({
            success: false,
            message:
                'Reader cannot borrow - check membership status or borrow limits'
        });
    }

    // Call stored procedure to create transaction (8 params: 5 IN + 3 OUT)
    let results;
    try {
        results = await callProcedure(
            'sp_process_borrowing',
            [
                reader_id,
                req.user.user_id,
                payment_method_id,
                notes || '',
                14, // p_borrow_days - default 14 days
                null, // OUT p_transaction_id
                null, // OUT p_success
                null // OUT p_message
            ],
            ['p_transaction_id', 'p_success', 'p_message']
        );
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Database procedure error: ' + error.message,
            error: error.message
        });
    }

    // Get result from last result set (OUT params are in the last one)
    const lastResultIndex = Array.isArray(results) ? results.length - 1 : 0;
    if (!results || !results[lastResultIndex] || !results[lastResultIndex][0]) {
        return res.status(500).json({
            success: false,
            message:
                'Invalid database response - procedure may need to be updated'
        });
    }

    const result = results[lastResultIndex][0];

    if (!result.p_success) {
        return res.status(400).json({
            success: false,
            message: result.p_message
        });
    }

    const transaction_id = result.p_transaction_id;

    // Add books to borrow_details if items provided
    if (items && items.length > 0) {
        try {
            for (const item of items) {
                await callProcedure(
                    'sp_add_book_to_transaction',
                    [
                        transaction_id,
                        item.copy_id,
                        item.borrow_days || 14,
                        item.daily_fee || 3000,
                        null, // OUT p_success
                        null // OUT p_message
                    ],
                    ['p_success', 'p_message']
                );
            }
        } catch (error) {
            console.error('Error adding books to transaction:', error);
            // Continue anyway, at least header was created
        }
    }

    res.status(201).json({
        success: true,
        message: result.p_message,
        data: {
            transaction_id: transaction_id
        }
    });
});

// Add book to transaction
const addBookToTransaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { copy_id, borrow_days, daily_fee } = req.body;

    const results = await callProcedure(
        'sp_add_book_to_transaction',
        [
            parseInt(id),
            parseInt(copy_id),
            parseInt(borrow_days) || 14,
            parseFloat(daily_fee) || 3000,
            null, // OUT p_success
            null // OUT p_message
        ],
        ['p_success', 'p_message']
    );

    const lastResultIndex = Array.isArray(results) ? results.length - 1 : 0;
    const result = results[lastResultIndex]
        ? results[lastResultIndex][0]
        : null;

    if (!result || !result.p_success) {
        return res.status(400).json({
            success: false,
            message: result?.p_message || 'Failed to add book to transaction'
        });
    }

    res.json({
        success: true,
        message: result.p_message
    });
});

// Finalize borrowing
const finalizeBorrowing = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const results = await callProcedure(
        'sp_finalize_borrowing',
        [
            parseInt(id),
            null, // OUT p_success
            null // OUT p_message
        ],
        ['p_success', 'p_message']
    );

    const lastResultIndex = Array.isArray(results) ? results.length - 1 : 0;
    const result = results[lastResultIndex]
        ? results[lastResultIndex][0]
        : null;

    if (!result || !result.p_success) {
        return res.status(400).json({
            success: false,
            message: result?.p_message || 'Failed to finalize borrowing'
        });
    }

    res.json({
        success: true,
        message: result.p_message
    });
});

// Cancel borrowing
const cancelBorrowing = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const results = await callProcedure(
        'sp_cancel_borrowing',
        [
            parseInt(id),
            req.user.user_id,
            reason || 'Cancelled by user',
            null, // OUT p_success
            null // OUT p_message
        ],
        ['p_success', 'p_message']
    );

    const lastResultIndex = Array.isArray(results) ? results.length - 1 : 0;
    const result = results[lastResultIndex]
        ? results[lastResultIndex][0]
        : null;

    if (!result || !result.p_success) {
        return res.status(400).json({
            success: false,
            message: result?.p_message || 'Failed to cancel borrowing'
        });
    }

    res.json({
        success: true,
        message: result.p_message
    });
});

// Process return by barcode
const processReturnByBarcode = asyncHandler(async (req, res) => {
    const {
        barcode,
        condition_on_return,
        damage_type_id,
        damage_description,
        fine_payment_method_id
    } = req.body;

    // Call stored procedure with all 9 params: 6 IN + 3 OUT
    let results;
    try {
        results = await callProcedure(
            'sp_process_return_by_barcode',
            [
                barcode,
                req.user.user_id,
                condition_on_return || 'good',
                damage_type_id || null,
                damage_description || '',
                fine_payment_method_id || null,
                null, // OUT p_success
                null, // OUT p_message
                null // OUT p_total_fine
            ],
            [
                'p_success',
                'p_message',
                'p_total_fine',
                'p_book_title',
                'p_days_late',
                'p_late_fee',
                'p_damage_fee'
            ]
        );
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Database procedure error: ' + error.message
        });
    }

    // OUT params are in the LAST result set
    const lastResultIndex = Array.isArray(results) ? results.length - 1 : 0;
    if (!results || !results[lastResultIndex] || !results[lastResultIndex][0]) {
        return res.status(500).json({
            success: false,
            message: 'Invalid database response'
        });
    }

    const result = results[lastResultIndex][0];

    if (!result.p_success) {
        return res.status(400).json({
            success: false,
            message: result.p_message,
            data: {
                book_title: result.p_book_title,
                days_late: result.p_days_late,
                late_fee: result.p_late_fee,
                damage_fee: result.p_damage_fee,
                total_fine: result.p_total_fine
            }
        });
    }

    res.json({
        success: true,
        message: result.p_message,
        data: {
            book_title: result.p_book_title,
            days_late: result.p_days_late,
            late_fee: result.p_late_fee,
            damage_fee: result.p_damage_fee,
            total_fine: result.p_total_fine
        }
    });
});

// Legacy: Process return (kept for backward compatibility)
const processReturn = asyncHandler(async (req, res) => {
    const {
        detail_id,
        condition_on_return,
        damage_type_id,
        damage_description,
        fine_payment_method_id
    } = req.body;

    const results = await callProcedure('sp_process_return', [
        detail_id,
        req.user.user_id,
        condition_on_return,
        damage_type_id,
        damage_description,
        fine_payment_method_id
    ]);

    const lastResultIndex = Array.isArray(results) ? results.length - 1 : 0;
    const result = results[lastResultIndex]
        ? results[lastResultIndex][0]
        : null;

    if (!result || !result.p_success) {
        return res.status(400).json({
            success: false,
            message: result?.p_message || 'Failed to process return'
        });
    }

    res.json({
        success: true,
        message: result.p_message,
        data: {
            total_fine: result.p_total_fine
        }
    });
});

// Pay fine
const payFine = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { payment_method_id } = req.body;

    const results = await callProcedure('sp_process_fine_payment', [
        id,
        payment_method_id
    ]);

    const lastResultIndex = Array.isArray(results) ? results.length - 1 : 0;
    const result = results[lastResultIndex]
        ? results[lastResultIndex][0]
        : null;

    if (!result || !result.p_success) {
        return res.status(400).json({
            success: false,
            message: result?.p_message || 'Failed to process payment'
        });
    }

    res.json({
        success: true,
        message: result.p_message
    });
});

// Get due alerts
const getDueAlerts = asyncHandler(async (req, res) => {
    const alerts = await query(
        `SELECT bt.transaction_id, bt.transaction_code, bt.expected_return_date,
            r.reader_id, r.card_number, r.full_name as reader_name, r.phone as reader_phone,
            bd.detail_id, b.book_id, b.title as book_title, bc.barcode,
            DATEDIFF(bt.expected_return_date, CURDATE()) as days_remaining,
            dr.is_sent, dr.sent_at
     FROM borrow_transactions bt
     JOIN readers r ON bt.reader_id = r.reader_id
     JOIN borrow_details bd ON bt.transaction_id = bd.transaction_id
     JOIN books b ON bd.book_id = b.book_id
     JOIN book_copies bc ON bd.copy_id = bc.copy_id
     LEFT JOIN due_reminders dr ON bt.transaction_id = dr.transaction_id 
         AND dr.days_remaining = LEAST(3, DATEDIFF(bt.expected_return_date, CURDATE()))
     WHERE bt.status = 'active'
     AND NOT EXISTS (SELECT 1 FROM return_records rr WHERE rr.detail_id = bd.detail_id)
     AND DATEDIFF(bt.expected_return_date, CURDATE()) BETWEEN -7 AND 3
     ORDER BY days_remaining ASC`
    );

    res.json({
        success: true,
        data: alerts
    });
});

// Get overdue books
const getOverdue = asyncHandler(async (req, res) => {
    const overdue = await query(
        `SELECT bt.transaction_id, bt.transaction_code, bt.expected_return_date,
            r.reader_id, r.card_number, r.full_name as reader_name, r.phone as reader_phone, r.email as reader_email,
            mt.tier_name,
            bd.detail_id, b.book_id, b.title as book_title, b.price as book_price, bc.barcode,
            DATEDIFF(CURDATE(), bt.expected_return_date) as days_overdue,
            calculate_late_fee(b.price, DATEDIFF(CURDATE(), bt.expected_return_date), 50.00) as estimated_fine
     FROM borrow_transactions bt
     JOIN readers r ON bt.reader_id = r.reader_id
     JOIN membership_tiers mt ON r.tier_id = mt.tier_id
     JOIN borrow_details bd ON bt.transaction_id = bd.transaction_id
     JOIN books b ON bd.book_id = b.book_id
     JOIN book_copies bc ON bd.copy_id = bc.copy_id
     WHERE bt.status = 'active'
     AND bt.expected_return_date < CURDATE()
     AND NOT EXISTS (SELECT 1 FROM return_records rr WHERE rr.detail_id = bd.detail_id)
     ORDER BY days_overdue DESC`
    );

    res.json({
        success: true,
        data: overdue
    });
});

// Get damage types
const getDamageTypes = asyncHandler(async (req, res) => {
    const types = await query(
        'SELECT * FROM damage_types WHERE is_active = TRUE ORDER BY fine_percentage'
    );

    res.json({
        success: true,
        data: types
    });
});

// Get payment methods
const getPaymentMethods = asyncHandler(async (req, res) => {
    const methods = await query(
        'SELECT * FROM payment_methods WHERE is_active = TRUE'
    );

    res.json({
        success: true,
        data: methods
    });
});

// Send reminder
const sendReminder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { days_remaining } = req.body;

    // Mark reminder as sent
    await query(
        `UPDATE due_reminders 
     SET is_sent = TRUE, sent_at = NOW(), sent_by = ?
     WHERE transaction_id = ? AND days_remaining = ?`,
        [req.user.user_id, id, days_remaining]
    );

    // Create notification
    await query(
        `INSERT INTO notifications (reader_id, notification_type, title, message, related_transaction_id)
     SELECT bt.reader_id, 'due_reminder', 'Nhắc nhở hạn trả sách',
            CONCAT('Bạn có sách cần trả trong ', ?, ' ngày'),
            bt.transaction_id
     FROM borrow_transactions bt
     WHERE bt.transaction_id = ?`,
        [days_remaining, id]
    );

    res.json({
        success: true,
        message: 'Reminder sent successfully'
    });
});

module.exports = {
    getAllBorrowings,
    getBorrowingById,
    createBorrowing,
    addBookToTransaction,
    finalizeBorrowing,
    cancelBorrowing,
    processReturn,
    processReturnByBarcode,
    payFine,
    getDueAlerts,
    getOverdue,
    getDamageTypes,
    getPaymentMethods,
    sendReminder
};
