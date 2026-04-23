const express = require('express');
const { body } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/trends', analyticsController.getMonthlyTrends);
router.get('/', analyticsController.getAnalyticsData);

router.post('/',
  authorizeRole('admin'),
  [
    body('metric_name').notEmpty().trim(),
    body('metric_value').isFloat(),
    body('category').notEmpty().trim(),
    body('metric_date').optional()
  ],
  analyticsController.addAnalyticsRecord
);

module.exports = router;
