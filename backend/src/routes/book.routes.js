const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
    getAllBooks,
    getBookById,
    getBookCopies,
    createBook,
    updateBook,
    deleteBook,
    addBookCopy,
    updateBookCopy,
    deleteBookCopy,
    searchByBarcode,
    getCategories,
    getAuthors,
    getPublishers
} = require('../controllers/book.controller');
const { asyncHandler } = require('../middleware/error.middleware');

// All routes require authentication
router.use(authenticate);

// Book routes
router.get('/', asyncHandler(getAllBooks));
router.get('/categories', asyncHandler(getCategories));
router.get('/authors', asyncHandler(getAuthors));
router.get('/publishers', asyncHandler(getPublishers));
router.get('/book-copies/search', asyncHandler(searchByBarcode));
router.put('/book-copies/:copyId', asyncHandler(updateBookCopy));
router.get('/:id', asyncHandler(getBookById));
router.get('/:id/copies', asyncHandler(getBookCopies));
router.post('/', asyncHandler(createBook));
router.put('/:id', asyncHandler(updateBook));
router.delete('/:id', asyncHandler(deleteBook));
router.post('/:id/copies', asyncHandler(addBookCopy));
router.delete('/:bookId/copies/:copyId', asyncHandler(deleteBookCopy));

module.exports = router;
