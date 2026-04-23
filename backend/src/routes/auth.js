const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  authController.login
);

router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim(),
    body('role').optional().isIn(['admin', 'manager', 'viewer'])
  ],
  authController.register
);

router.get('/me', authenticateToken, authController.getCurrentUser);

router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  authController.changePassword
);

router.post('/refresh',
  [
    body('refreshToken').notEmpty()
  ],
  authController.refreshToken
);

router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
