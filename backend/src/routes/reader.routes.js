const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
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
} = require('../controllers/reader.controller');
const { asyncHandler } = require('../middleware/error.middleware');

// All routes require authentication
router.use(authenticate);

// Reader routes
router.get('/', asyncHandler(getAllReaders));
router.get('/search', asyncHandler(searchReaders));
router.get('/membership-tiers', asyncHandler(getMembershipTiers));
router.post('/:id/restore', asyncHandler(restoreReader));
router.get('/:id', asyncHandler(getReaderById));
router.get('/:id/borrows', asyncHandler(getReaderBorrows));
router.post('/', asyncHandler(createReader));
router.put('/:id', asyncHandler(updateReader));
router.delete('/:id', asyncHandler(deleteReader));
router.post('/:id/change-tier', asyncHandler(changeTier));

module.exports = router;
