const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');

// Login
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    console.log('[LOGIN] Attempt:', email);

    if (!email || !password) {
        console.log('[LOGIN] Missing email or password');
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    // Find user
    const users = await query(
        `SELECT u.user_id, u.email, u.password_hash, u.full_name, u.phone, u.is_active,
            GROUP_CONCAT(r.role_name) as roles
     FROM users u
     LEFT JOIN user_roles ur ON u.user_id = ur.user_id
     LEFT JOIN roles r ON ur.role_id = r.role_id
     WHERE u.email = ? AND u.deleted_at IS NULL AND u.is_active = TRUE
     GROUP BY u.user_id`,
        [email]
    );

    console.log('[LOGIN] User found:', users.length > 0);

    if (users.length === 0) {
        console.log('[LOGIN] User not found or inactive');
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    const user = users[0];
    console.log('[LOGIN] User ID:', user.user_id, 'Active:', user.is_active);
    console.log('[LOGIN] DB password_hash:', user.password_hash);
    console.log('[LOGIN] Input password length:', password?.length);
    console.log('[LOGIN] Input password:', JSON.stringify(password));

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('[LOGIN] Password match:', isMatch);

    // Debug: Test with known working hash
    const testHash =
        '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqXzJxPLRh1Vj2Cb8L8nL1pMbJtZW';
    const testMatch = await bcrypt.compare('admin123', testHash);
    console.log('[LOGIN] Test hash match (should be true):', testMatch);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE user_id = ?', [
        user.user_id
    ]);

    // Generate JWT
    const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                roles: user.roles ? user.roles.split(',') : []
            }
        }
    });
});

// Get current user
const getMe = asyncHandler(async (req, res) => {
    const userRoles = await query(
        `SELECT r.role_name FROM roles r
     JOIN user_roles ur ON r.role_id = ur.role_id
     WHERE ur.user_id = ?`,
        [req.user.user_id]
    );

    res.json({
        success: true,
        data: {
            ...req.user,
            roles: userRoles.map((r) => r.role_name)
        }
    });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const users = await query(
        'SELECT password_hash FROM users WHERE user_id = ?',
        [req.user.user_id]
    );

    const isMatch = await bcrypt.compare(
        currentPassword,
        users[0].password_hash
    );
    if (!isMatch) {
        return res.status(400).json({
            success: false,
            message: 'Current password is incorrect'
        });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password_hash = ? WHERE user_id = ?', [
        newHash,
        req.user.user_id
    ]);

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});

module.exports = {
    login,
    getMe,
    changePassword
};
