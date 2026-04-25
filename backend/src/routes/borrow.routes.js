const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
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
} = require('../controllers/borrow.controller');
const { asyncHandler } = require('../middleware/error.middleware');

// All routes require authentication
router.use(authenticate);

// Borrow routes
router.get('/', asyncHandler(getAllBorrowings));
router.get('/due-alerts', asyncHandler(getDueAlerts));
router.get('/overdue', asyncHandler(getOverdue));
router.get('/damage-types', asyncHandler(getDamageTypes));
router.get('/payment-methods', asyncHandler(getPaymentMethods));
router.get('/:id', asyncHandler(getBorrowingById));
router.post('/', asyncHandler(createBorrowing));
router.post('/:id/books', asyncHandler(addBookToTransaction));
router.post('/:id/finalize', asyncHandler(finalizeBorrowing));
router.post('/:id/cancel', asyncHandler(cancelBorrowing));
router.post('/:id/remind', asyncHandler(sendReminder));

// Return routes
router.post('/returns', asyncHandler(processReturn));
router.post('/returns/barcode', asyncHandler(processReturnByBarcode));
router.post('/returns/:id/pay-fine', asyncHandler(payFine));

module.exports = router;
