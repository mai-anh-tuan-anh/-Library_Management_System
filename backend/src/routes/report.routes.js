const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getRevenueDaily,
  getRevenueWeekly,
  getRevenueMonthly,
  getTopBooks,
  getTopReaders,
  getInventory,
  getDashboardStats,
  exportReport
} = require('../controllers/report.controller');
const { asyncHandler } = require('../middleware/error.middleware');

// All routes require authentication
router.use(authenticate);

// Report routes
router.get('/revenue/daily', asyncHandler(getRevenueDaily));
router.get('/revenue/weekly', asyncHandler(getRevenueWeekly));
router.get('/revenue/monthly', asyncHandler(getRevenueMonthly));
router.get('/top-books', asyncHandler(getTopBooks));
router.get('/top-readers', asyncHandler(getTopReaders));
router.get('/inventory', asyncHandler(getInventory));
router.get('/dashboard', asyncHandler(getDashboardStats));
router.get('/export/:type', asyncHandler(exportReport));

module.exports = router;
