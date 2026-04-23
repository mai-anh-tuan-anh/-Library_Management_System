const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Get user from database
    const users = await query(
      'SELECT user_id, email, full_name, is_active FROM users WHERE user_id = ? AND deleted_at IS NULL',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive.' 
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired.' 
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      const userRoles = await query(
        `SELECT r.role_name FROM roles r
         JOIN user_roles ur ON r.role_id = ur.role_id
         WHERE ur.user_id = ?`,
        [req.user.user_id]
      );

      const hasRole = userRoles.some(ur => roles.includes(ur.role_name));
      
      if (!hasRole) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Insufficient permissions.' 
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error.' 
      });
    }
  };
};

module.exports = { authenticate, authorize };
