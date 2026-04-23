const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { paginateResults } = require('../utils/helpers');

// Get all books
const getAllBooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, category_id, is_active } = req.query;
    const { offset, limit: pageSize } = paginateResults(page, limit);

    let whereClause = 'WHERE b.deleted_at IS NULL';
    const params = [];

    if (search) {
        whereClause += ` AND (b.title LIKE ? OR b.book_code LIKE ? OR b.isbn LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
        whereClause += ` AND b.category_id = ?`;
        params.push(category_id);
    }

    if (is_active !== undefined) {
        whereClause += ` AND b.is_active = ?`;
        params.push(is_active === 'true' ? 1 : 0);
    }

    // Get total count
    const [countResult] = await query(
        `SELECT COUNT(*) as total FROM books b ${whereClause}`,
        params
    );

    // Get books with authors and dynamic copy counts
    const books = await query(
        `SELECT b.*, c.category_name, p.publisher_name,
            (SELECT GROUP_CONCAT(a.full_name SEPARATOR ', ') 
             FROM book_authors ba 
             JOIN authors a ON ba.author_id = a.author_id 
             WHERE ba.book_id = b.book_id) as authors,
            (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.book_id AND bc.deleted_at IS NULL) as total_copies,
            (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.book_id AND bc.deleted_at IS NULL AND bc.status = 'available') as available_copies
     FROM books b
     LEFT JOIN categories c ON b.category_id = c.category_id
     LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
     ${whereClause}
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
    );

    res.json({
        success: true,
        data: books,
        pagination: {
            page: parseInt(page),
            limit: pageSize,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / pageSize)
        }
    });
});

// Get book by ID
const getBookById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const books = await query(
        `SELECT b.*, c.category_name, p.publisher_name,
            (SELECT GROUP_CONCAT(a.full_name SEPARATOR ', ') 
             FROM book_authors ba 
             JOIN authors a ON ba.author_id = a.author_id 
             WHERE ba.book_id = b.book_id) as authors,
            (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.book_id AND bc.deleted_at IS NULL) as total_copies,
            (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.book_id AND bc.deleted_at IS NULL AND bc.status = 'available') as available_copies
     FROM books b
     LEFT JOIN categories c ON b.category_id = c.category_id
     LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
     WHERE b.book_id = ? AND b.deleted_at IS NULL`,
        [id]
    );

    if (books.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Book not found'
        });
    }

    res.json({
        success: true,
        data: books[0]
    });
});

// Get book copies
const getBookCopies = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const copies = await query(
        `SELECT bc.*, COALESCE(bc.location_code, sl.location_code) as location_code, sl.floor, sl.section, sl.shelf_number
     FROM book_copies bc
     LEFT JOIN shelf_locations sl ON bc.shelf_location_id = sl.location_id
     WHERE bc.book_id = ? AND bc.deleted_at IS NULL
     ORDER BY bc.barcode`,
        [id]
    );

    res.json({
        success: true,
        data: copies
    });
});

// Create book
const createBook = asyncHandler(async (req, res) => {
    const {
        isbn,
        title,
        author,
        publisher_id,
        category_id,
        publish_year,
        language,
        summary,
        price,
        borrow_price_per_day
    } = req.body;

    // Generate book code
    const [lastBook] = await query('SELECT MAX(book_id) as max_id FROM books');
    const nextId = (lastBook.max_id || 0) + 1;
    const bookCode = `BK${String(nextId).padStart(3, '0')}`;

    // Generate ISBN if not provided
    const finalIsbn =
        isbn ||
        `${Date.now().toString().slice(-8)}${String(nextId).padStart(4, '0')}`;

    const result = await query(
        `INSERT INTO books (isbn, book_code, title, author, publisher_id, category_id, publish_year,
                        language, summary, price, borrow_price_per_day, total_copies, available_copies)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
            finalIsbn,
            bookCode,
            title,
            author || null,
            publisher_id || null,
            category_id || null,
            publish_year || null,
            language || 'vi',
            summary || null,
            price || null,
            borrow_price_per_day || null
        ]
    );

    const newBook = await query(
        `SELECT b.*, c.category_name, p.publisher_name
     FROM books b
     LEFT JOIN categories c ON b.category_id = c.category_id
     LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
     WHERE b.book_id = ?`,
        [result.insertId]
    );

    res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: newBook[0]
    });
});

// Update book
const updateBook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title,
        author,
        subtitle,
        publisher_id,
        category_id,
        publish_year,
        language,
        summary,
        price,
        borrow_price_per_day,
        is_active
    } = req.body;

    await query(
        `UPDATE books 
     SET title = ?, author = ?, subtitle = ?, publisher_id = ?, category_id = ?, publish_year = ?, 
         language = ?, summary = ?, price = ?, borrow_price_per_day = ?, is_active = ?
     WHERE book_id = ?`,
        [
            title,
            author || null,
            subtitle || null,
            publisher_id || null,
            category_id || null,
            publish_year || null,
            language || 'vi',
            summary || null,
            price || null,
            borrow_price_per_day || null,
            is_active,
            id
        ]
    );

    const updatedBook = await query(
        `SELECT b.*, c.category_name, p.publisher_name
     FROM books b
     LEFT JOIN categories c ON b.category_id = c.category_id
     LEFT JOIN publishers p ON b.publisher_id = p.publisher_id
     WHERE b.book_id = ?`,
        [id]
    );

    res.json({
        success: true,
        message: 'Book updated successfully',
        data: updatedBook[0]
    });
});

// Soft delete book
const deleteBook = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check for active borrows
    const activeBorrows = await query(
        `SELECT COUNT(*) as count FROM borrow_details bd
     JOIN book_copies bc ON bd.copy_id = bc.copy_id
     JOIN borrow_transactions bt ON bd.transaction_id = bt.transaction_id
     WHERE bc.book_id = ? AND bt.status = 'active'`,
        [id]
    );

    if (activeBorrows[0].count > 0) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete book with active borrows'
        });
    }

    await query('UPDATE books SET deleted_at = NOW() WHERE book_id = ?', [id]);

    res.json({
        success: true,
        message: 'Book deleted successfully'
    });
});

// Add book copy
const addBookCopy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        barcode,
        location_code,
        acquisition_date,
        condition_status = 'good'
    } = req.body;

    // Use provided barcode or generate one
    const finalBarcode =
        barcode ||
        `LIB-${String(id).padStart(6, '0')}-${Date.now().toString().slice(-6)}`;

    const result = await query(
        `INSERT INTO book_copies (book_id, barcode, location_code, acquisition_date, condition_status, status)
     VALUES (?, ?, ?, ?, ?, 'available')`,
        [
            id,
            finalBarcode,
            location_code || null,
            acquisition_date,
            condition_status
        ]
    );

    // Update book inventory counts
    await query(
        `UPDATE books SET total_copies = total_copies + 1, available_copies = available_copies + 1 WHERE book_id = ?`,
        [id]
    );

    const newCopy = await query(`SELECT * FROM book_copies WHERE copy_id = ?`, [
        result.insertId
    ]);

    res.status(201).json({
        success: true,
        message: 'Book copy added successfully',
        data: newCopy[0]
    });
});

// Search book copy by barcode
const searchByBarcode = asyncHandler(async (req, res) => {
    const { barcode } = req.query;

    if (!barcode) {
        return res.status(400).json({
            success: false,
            message: 'Barcode is required'
        });
    }

    const copies = await query(
        `SELECT bc.*, b.book_id, b.title, b.price, b.borrow_price_per_day, b.cover_image,
            sl.location_code
     FROM book_copies bc
     JOIN books b ON bc.book_id = b.book_id
     LEFT JOIN shelf_locations sl ON bc.shelf_location_id = sl.location_id
     WHERE bc.barcode = ? AND bc.status = 'available' AND bc.deleted_at IS NULL`,
        [barcode]
    );

    if (copies.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Book copy not found or not available'
        });
    }

    res.json({
        success: true,
        data: copies[0]
    });
});

// Get categories
const getCategories = asyncHandler(async (req, res) => {
    const categories = await query(
        'SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY category_name'
    );

    res.json({
        success: true,
        data: categories
    });
});

// Get authors
const getAuthors = asyncHandler(async (req, res) => {
    const authors = await query(
        'SELECT * FROM authors WHERE deleted_at IS NULL ORDER BY full_name'
    );

    res.json({
        success: true,
        data: authors
    });
});

// Get publishers
const getPublishers = asyncHandler(async (req, res) => {
    const publishers = await query(
        'SELECT * FROM publishers WHERE deleted_at IS NULL ORDER BY publisher_name'
    );

    res.json({
        success: true,
        data: publishers
    });
});

// Update book copy
const updateBookCopy = asyncHandler(async (req, res) => {
    const { copyId } = req.params;
    const { shelf_location_id, condition_status, status, notes } = req.body;

    const updates = [];
    const values = [];

    if (shelf_location_id !== undefined) {
        updates.push('shelf_location_id = ?');
        values.push(shelf_location_id);
    }
    if (condition_status !== undefined) {
        updates.push('condition_status = ?');
        values.push(condition_status);
    }
    if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
    }
    if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
    }

    if (updates.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No fields to update'
        });
    }

    values.push(copyId);

    await query(
        `UPDATE book_copies SET ${updates.join(', ')} WHERE copy_id = ?`,
        values
    );

    const updatedCopy = await query(
        `SELECT bc.*, sl.location_code
     FROM book_copies bc
     LEFT JOIN shelf_locations sl ON bc.shelf_location_id = sl.location_id
     WHERE bc.copy_id = ?`,
        [copyId]
    );

    res.json({
        success: true,
        message: 'Book copy updated successfully',
        data: updatedCopy[0]
    });
});

module.exports = {
    getAllBooks,
    getBookById,
    getBookCopies,
    createBook,
    updateBook,
    deleteBook,
    addBookCopy,
    updateBookCopy,
    searchByBarcode,
    getCategories,
    getAuthors,
    getPublishers
};
