const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { apiResponse, apiError } = require('../utils/apiFeatures');

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiError(res, 'Validation failed', 400, errors.array());
    }

    const { email, password } = req.body;

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return apiError(res, 'Invalid email or password', 401);
    }

    const user = users[0];
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return apiError(res, 'Invalid email or password', 401);
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'mocmv_secure_secret_key_2026',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'mocmv_refresh_secret_key_2026',
      { expiresIn: '7d' }
    );

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    // Get fresh user data with updated last_login
    const [updatedUsers] = await pool.query(
      'SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?',
      [user.id]
    );

    return apiResponse(res, {
      user: updatedUsers[0],
      accessToken,
      refreshToken,
      expiresIn: 86400,
      company: {
        name: 'MOC-MV Company Ltd',
        dashboard: user.role === 'manager' || user.role === 'admin' ? 'Manager Dashboard' : 'Employee Dashboard'
      }
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiError(res, 'Validation failed', 400, errors.array());
    }

    const { email, password, name, role } = req.body;

    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return apiError(res, 'User with this email already exists', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, role || 'manager']
    );

    const [newUser] = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [result.insertId]);

    return apiResponse(res, {
      user: newUser[0],
      message: 'User created successfully'
    }).status(201);
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return apiError(res, 'User not found', 404);
    }

    return apiResponse(res, { user: users[0] });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiError(res, 'Validation failed', 400, errors.array());
    }

    const { currentPassword, newPassword } = req.body;

    const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return apiError(res, 'User not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    
    if (!isPasswordValid) {
      return apiError(res, 'Current password is incorrect', 401);
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    return apiResponse(res, { message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getCurrentUser,
  changePassword
};
