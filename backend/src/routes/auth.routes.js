const express = require('express');
const router = express.Router();
const { login, getMe, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { asyncHandler } = require('../middleware/error.middleware');

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const validateChangePassword = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

// Routes
router.post('/login', validateLogin, asyncHandler(login));
router.get('/me', authenticate, asyncHandler(getMe));
router.post('/change-password', authenticate, validateChangePassword, asyncHandler(changePassword));

module.exports = router;
