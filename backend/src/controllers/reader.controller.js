const { query, callProcedure } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { paginateResults, generateCardNumber } = require('../utils/helpers');

// Get all readers
const getAllReaders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, tier_id, is_active } = req.query;
    const { offset, limit: pageSize } = paginateResults(page, limit);

    let whereClause = 'WHERE r.deleted_at IS NULL';
    const params = [];

    if (search) {
        whereClause += ` AND (r.card_number LIKE ? OR r.full_name LIKE ? OR r.phone LIKE ? OR r.email LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (tier_id) {
        whereClause += ` AND r.tier_id = ?`;
        params.push(tier_id);
    }

    if (is_active !== undefined) {
        whereClause += ` AND r.is_active = ?`;
        params.push(is_active === 'true' ? 1 : 0);
    }

    // Get total count
    const [countResult] = await query(
        `SELECT COUNT(*) as total FROM readers r ${whereClause}`,
        params
    );

    // Get readers
    const readers = await query(
        `SELECT r.*, mt.tier_name, mt.badge_icon, mt.badge_color, mt.max_books, mt.max_borrow_days,
            (SELECT COUNT(*) FROM borrow_transactions bt WHERE bt.reader_id = r.reader_id AND bt.status = 'active') as active_transactions,
            (SELECT COUNT(*) FROM return_records rr 
             JOIN borrow_transactions bt ON rr.transaction_id = bt.transaction_id 
             WHERE bt.reader_id = r.reader_id AND rr.fine_paid = FALSE AND rr.fine_amount > 0) as unpaid_fines
     FROM readers r
     JOIN membership_tiers mt ON r.tier_id = mt.tier_id
     ${whereClause}
     ORDER BY r.registered_at DESC
     LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
    );

    res.json({
        success: true,
        data: readers,
        pagination: {
            page: parseInt(page),
            limit: pageSize,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / pageSize)
        }
    });
});

// Search readers
const searchReaders = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.json({ success: true, data: [] });
    }

    // Call stored procedure
    const results = await callProcedure('sp_search_reader', [q.trim()]);

    res.json({
        success: true,
        data: results[0] || []
    });
});

// Get reader by ID
const getReaderById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const readers = await query(
        `SELECT r.*, mt.tier_name, mt.badge_icon, mt.badge_color, mt.max_books, mt.max_borrow_days,
            (SELECT COUNT(*) FROM borrow_transactions bt WHERE bt.reader_id = r.reader_id AND bt.status = 'active') as active_transactions,
            (SELECT COUNT(*) FROM return_records rr 
             JOIN borrow_transactions bt ON rr.transaction_id = bt.transaction_id 
             WHERE bt.reader_id = r.reader_id AND rr.fine_paid = FALSE AND rr.fine_amount > 0) as unpaid_fines
     FROM readers r
     JOIN membership_tiers mt ON r.tier_id = mt.tier_id
     WHERE r.reader_id = ? AND r.deleted_at IS NULL`,
        [id]
    );

    if (readers.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Reader not found'
        });
    }

    res.json({
        success: true,
        data: readers[0]
    });
});

// Get reader's current borrows
const getReaderBorrows = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Call stored procedure
    const results = await callProcedure('sp_get_reader_current_borrows', [id]);

    res.json({
        success: true,
        data: results[0] || []
    });
});

// Create reader
const createReader = asyncHandler(async (req, res) => {
    const {
        full_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        id_card,
        tier_id = 1
    } = req.body;

    // Check if phone or email already exists
    const existing = await query(
        'SELECT reader_id FROM readers WHERE (phone = ? OR email = ?) AND deleted_at IS NULL',
        [phone, email]
    );

    if (existing.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Phone or email already registered'
        });
    }

    const cardNumber = generateCardNumber();

    const result = await query(
        `INSERT INTO readers (card_number, full_name, date_of_birth, gender, phone, email, address, id_card, tier_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            cardNumber,
            full_name,
            date_of_birth,
            gender,
            phone,
            email,
            address,
            id_card,
            tier_id,
            req.user.user_id
        ]
    );

    const newReader = await query(
        `SELECT r.*, mt.tier_name, mt.max_books, mt.max_borrow_days
     FROM readers r
     JOIN membership_tiers mt ON r.tier_id = mt.tier_id
     WHERE r.reader_id = ?`,
        [result.insertId]
    );

    res.status(201).json({
        success: true,
        message: 'Reader created successfully',
        data: newReader[0]
    });
});

// Update reader
const updateReader = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        full_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        id_card,
        is_active,
        tier_id
    } = req.body;

    // Check if reader exists
    const existing = await query(
        'SELECT reader_id FROM readers WHERE reader_id = ? AND deleted_at IS NULL',
        [id]
    );

    if (existing.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Reader not found'
        });
    }

    await query(
        `UPDATE readers 
     SET full_name = ?, date_of_birth = ?, gender = ?, phone = ?, email = ?, address = ?, id_card = ?, is_active = ?, tier_id = ?
     WHERE reader_id = ?`,
        [
            full_name,
            date_of_birth || null,
            gender,
            phone,
            email || null,
            address || null,
            id_card || null,
            is_active !== undefined ? is_active : true,
            tier_id || null,
            id
        ]
    );

    const updatedReader = await query(
        `SELECT r.*, mt.tier_name, mt.max_books, mt.max_borrow_days
     FROM readers r
     JOIN membership_tiers mt ON r.tier_id = mt.tier_id
     WHERE r.reader_id = ?`,
        [id]
    );

    res.json({
        success: true,
        message: 'Reader updated successfully',
        data: updatedReader[0]
    });
});

// Soft delete reader
const deleteReader = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check for active borrows
    const activeBorrows = await query(
        `SELECT COUNT(*) as count FROM borrow_transactions 
     WHERE reader_id = ? AND status = 'active'`,
        [id]
    );

    if (activeBorrows[0].count > 0) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete reader with active borrows'
        });
    }

    await query('UPDATE readers SET deleted_at = NOW() WHERE reader_id = ?', [
        id
    ]);

    res.json({
        success: true,
        message: 'Reader deleted successfully'
    });
});

// Get membership tiers
const getMembershipTiers = asyncHandler(async (req, res) => {
    const tiers = await query(
        'SELECT * FROM membership_tiers ORDER BY tier_id'
    );

    res.json({
        success: true,
        data: tiers
    });
});

// Change membership tier
const changeTier = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tier_id, reason } = req.body;

    const oldTier = await query(
        'SELECT tier_id FROM readers WHERE reader_id = ?',
        [id]
    );

    if (oldTier.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Reader not found'
        });
    }

    // Record history
    await query(
        `INSERT INTO membership_history (reader_id, old_tier_id, new_tier_id, change_reason, changed_by)
     VALUES (?, ?, ?, ?, ?)`,
        [id, oldTier[0].tier_id, tier_id, reason, req.user.user_id]
    );

    // Update reader
    await query('UPDATE readers SET tier_id = ? WHERE reader_id = ?', [
        tier_id,
        id
    ]);

    res.json({
        success: true,
        message: 'Membership tier changed successfully'
    });
});

// Restore reader (undo soft delete)
const restoreReader = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await query(
        'SELECT reader_id FROM readers WHERE reader_id = ? AND deleted_at IS NOT NULL',
        [id]
    );

    if (existing.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Reader not found or not deleted'
        });
    }

    await query('UPDATE readers SET deleted_at = NULL WHERE reader_id = ?', [
        id
    ]);

    res.json({
        success: true,
        message: 'Reader restored successfully'
    });
});

module.exports = {
    getAllReaders,
    searchReaders,
    getReaderById,
    getReaderBorrows,
    createReader,
    updateReader,
    deleteReader,
    restoreReader,
    getMembershipTiers,
    changeTier
};
