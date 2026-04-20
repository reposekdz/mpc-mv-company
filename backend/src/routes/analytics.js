const express = require('express');
const { body } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', analyticsController.getAnalyticsData);
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/trends', analyticsController.getMonthlyTrends);

router.post('/',
  authorizeRole('admin'),
  [
    body('month').notEmpty(),
    body('revenue').isFloat({ min: 0 }),
    body('expenses').isFloat({ min: 0 }),
    body('profit').isFloat(),
    body('jobs_completed').isInt({ min: 0 })
  ],
  analyticsController.addAnalyticsRecord
);

module.exports = router;
