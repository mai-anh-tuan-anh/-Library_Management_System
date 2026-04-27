const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');

// Get revenue daily
const getRevenueDaily = asyncHandler(async (req, res) => {
    const { start_date, end_date, limit = 30 } = req.query;

    let whereClause = '';
    const params = [];

    if (start_date && end_date) {
        whereClause = 'WHERE revenue_date BETWEEN ? AND ?';
        params.push(start_date, end_date);
    }

    const revenue = await query(
        `SELECT * FROM vw_revenue_daily 
     ${whereClause}
     ORDER BY revenue_date DESC
     LIMIT ?`,
        [...params, parseInt(limit)]
    );

    res.json({
        success: true,
        data: revenue
    });
});

// Get revenue weekly
const getRevenueWeekly = asyncHandler(async (req, res) => {
    const { limit = 4 } = req.query;

    const revenue = await query(
        `SELECT * FROM vw_revenue_weekly 
     ORDER BY week_label DESC
     LIMIT ?`,
        [parseInt(limit)]
    );

    res.json({
        success: true,
        data: revenue
    });
});

// Get revenue monthly
const getRevenueMonthly = asyncHandler(async (req, res) => {
    const { year, limit = 12 } = req.query;

    let whereClause = '';
    const params = [];

    if (year) {
        whereClause = 'WHERE year = ?';
        params.push(year);
    }

    const revenue = await query(
        `SELECT * FROM vw_revenue_monthly 
     ${whereClause}
     ORDER BY year DESC, month DESC
     LIMIT ?`,
        [...params, parseInt(limit)]
    );

    res.json({
        success: true,
        data: revenue
    });
});

// Get top books
const getTopBooks = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const books = await query(
        `SELECT 
            b.book_id,
            b.title,
            b.book_code,
            c.category_name,
            COUNT(DISTINCT bd.detail_id) as total_borrows,
            COUNT(DISTINCT bt.reader_id) as unique_readers,
            COALESCE(SUM(bd.subtotal), 0) + COALESCE(SUM(rr.fine_amount), 0) as total_revenue
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.category_id
        LEFT JOIN borrow_details bd ON b.book_id = bd.book_id
        LEFT JOIN borrow_transactions bt ON bd.transaction_id = bt.transaction_id
        LEFT JOIN return_records rr ON rr.detail_id = bd.detail_id
        GROUP BY b.book_id, b.title, b.book_code, c.category_name
        ORDER BY total_borrows DESC, unique_readers DESC, total_revenue DESC, b.title ASC
        LIMIT ?`,
        [parseInt(limit)]
    );

    res.json({
        success: true,
        data: books
    });
});

// Get top readers
const getTopReaders = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const readers = await query(
        `SELECT 
            r.reader_id,
            r.full_name,
            r.card_number,
            mt.tier_name as member_level,
            COUNT(DISTINCT bt.transaction_id) as total_borrows,
            COUNT(DISTINCT bd.book_id) as books_read,
            COALESCE(SUM(bt.borrow_fee), 0) + COALESCE(SUM(rr.fine_amount), 0) as total_spent
        FROM readers r
        LEFT JOIN membership_tiers mt ON r.tier_id = mt.tier_id
        LEFT JOIN borrow_transactions bt ON r.reader_id = bt.reader_id AND bt.status != 'cancelled'
        LEFT JOIN borrow_details bd ON bt.transaction_id = bd.transaction_id
        LEFT JOIN return_records rr ON rr.detail_id = bd.detail_id
        GROUP BY r.reader_id, r.full_name, r.card_number, mt.tier_name
        ORDER BY total_borrows DESC, total_spent DESC, member_level DESC, books_read DESC, r.full_name ASC
        LIMIT ?`,
        [parseInt(limit)]
    );

    res.json({
        success: true,
        data: readers
    });
});

// Get inventory status
const getInventory = asyncHandler(async (req, res) => {
    const { category_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    const conditions = [];

    if (category_id) {
        conditions.push('category_id = ?');
        params.push(category_id);
    }

    if (status) {
        conditions.push(
            'availability_percentage ' +
                (status === 'low' ? '< 20' : status === 'out' ? '= 0' : '> 50')
        );
    }

    if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const [countResult] = await query(
        `SELECT COUNT(*) as total FROM vw_inventory_status ${whereClause}`,
        params
    );

    const inventory = await query(
        `SELECT * FROM vw_inventory_status 
     ${whereClause}
     ORDER BY availability_percentage ASC
     LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    res.json({
        success: true,
        data: inventory,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / limit)
        }
    });
});

// Get dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
    // Calculate stats separately to avoid join issues
    const [bookCount] = await query(
        `SELECT COUNT(*) as total_books FROM books WHERE deleted_at IS NULL`
    );

    const [copyCount] = await query(
        `SELECT 
      COUNT(*) as total_copies,
      COUNT(CASE WHEN bc.status = 'borrowed' THEN 1 END) as borrowed_copies,
      COUNT(CASE WHEN bc.status = 'available' THEN 1 END) as total_available_copies
     FROM book_copies bc
     JOIN books b ON bc.book_id = b.book_id
     WHERE bc.deleted_at IS NULL AND b.deleted_at IS NULL`
    );

    const [readerCount] = await query(
        `SELECT COUNT(*) as total_active_readers FROM readers WHERE deleted_at IS NULL`
    );

    // Today's new items
    const [todayNewBooks] = await query(
        `SELECT COUNT(*) as new_books_today FROM books WHERE DATE(created_at) = CURDATE() AND deleted_at IS NULL`
    );

    const [todayNewReaders] = await query(
        `SELECT COUNT(*) as new_readers_today FROM readers WHERE DATE(registered_at) = CURDATE() AND deleted_at IS NULL`
    );

    const [todayNewCopies] = await query(
        `SELECT COUNT(*) as new_copies_today FROM book_copies WHERE DATE(acquisition_date) = CURDATE() AND deleted_at IS NULL`
    );

    // Today's stats - borrowings and returns
    const [todayStats] = await query(
        `SELECT 
      COUNT(*) as borrows_today,
      COALESCE(SUM(borrow_fee), 0) as borrow_revenue_today
     FROM borrow_transactions 
     WHERE DATE(borrow_date) = CURDATE()
     AND status != 'cancelled'`
    );

    const [todayReturns] = await query(
        `SELECT 
      COUNT(*) as returns_today,
      COALESCE(SUM(fine_amount), 0) as fine_revenue_today
     FROM return_records 
     WHERE DATE(return_date) = CURDATE()`
    );

    // Total revenue today = borrow fee + fines (parse as numbers)
    const totalRevenueToday =
        parseFloat(todayStats.borrow_revenue_today || 0) +
        parseFloat(todayReturns.fine_revenue_today || 0);

    // Additional stats
    const [weeklyStats] = await query(
        `SELECT 
      COUNT(*) as borrows_this_week,
      COALESCE(SUM(borrow_fee), 0) as borrow_revenue_this_week
     FROM borrow_transactions 
     WHERE YEARWEEK(borrow_date) = YEARWEEK(CURDATE())
     AND status != 'cancelled'`
    );

    const [weeklyReturns] = await query(
        `SELECT 
      COALESCE(SUM(fine_amount), 0) as fine_revenue_this_week
     FROM return_records 
     WHERE YEARWEEK(return_date) = YEARWEEK(CURDATE())`
    );

    const [monthlyStats] = await query(
        `SELECT COUNT(*) as borrows_this_month,
            COALESCE(SUM(borrow_fee), 0) as borrow_revenue_this_month
     FROM borrow_transactions 
     WHERE MONTH(borrow_date) = MONTH(CURDATE()) 
     AND YEAR(borrow_date) = YEAR(CURDATE())
     AND status != 'cancelled'`
    );

    const [monthlyReturns] = await query(
        `SELECT 
      COALESCE(SUM(fine_amount), 0) as fine_revenue_this_month
     FROM return_records 
     WHERE MONTH(return_date) = MONTH(CURDATE()) 
     AND YEAR(return_date) = YEAR(CURDATE())`
    );

    // Calculate total revenues
    const totalRevenueWeek =
        (weeklyStats.borrow_revenue_this_week || 0) +
        (weeklyReturns.fine_revenue_this_week || 0);
    const totalRevenueMonth =
        (monthlyStats.borrow_revenue_this_month || 0) +
        (monthlyReturns.fine_revenue_this_month || 0);

    res.json({
        success: true,
        data: {
            ...bookCount,
            ...copyCount,
            ...readerCount,
            ...todayNewBooks,
            ...todayNewReaders,
            ...todayNewCopies,
            ...todayStats,
            ...todayReturns,
            revenue_today: totalRevenueToday,
            ...weeklyStats,
            revenue_this_week: totalRevenueWeek,
            ...monthlyStats,
            revenue_this_month: totalRevenueMonth
        }
    });
});

// Export report
const exportReport = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { format = 'csv' } = req.query;

    let data = [];
    let filename = '';

    switch (type) {
        case 'revenue':
            data = await query(
                'SELECT * FROM vw_revenue_monthly ORDER BY month_key DESC'
            );
            filename = 'revenue_report.csv';
            break;
        case 'books':
            data = await query('SELECT * FROM vw_inventory_status');
            filename = 'inventory_report.csv';
            break;
        case 'readers':
            data = await query('SELECT * FROM vw_top_readers');
            filename = 'readers_report.csv';
            break;
        default:
            return res.status(400).json({
                success: false,
                message: 'Invalid report type'
            });
    }

    // Convert to CSV
    if (format === 'csv' && data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data
            .map((row) =>
                Object.values(row)
                    .map((val) =>
                        typeof val === 'string'
                            ? `"${val.replace(/"/g, '""')}"`
                            : val
                    )
                    .join(',')
            )
            .join('\n');

        const csv = headers + '\n' + rows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${filename}`
        );
        res.send(csv);
    } else {
        res.json({
            success: true,
            data
        });
    }
});

module.exports = {
    getRevenueDaily,
    getRevenueWeekly,
    getRevenueMonthly,
    getTopBooks,
    getTopReaders,
    getInventory,
    getDashboardStats,
    exportReport
};
