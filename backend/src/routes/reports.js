const express = require('express');
const { body } = require('express-validator');
const reportsController = require('../controllers/reportsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', reportsController.getAllReports);
router.get('/stats', reportsController.getReportStats);
router.get('/:id', reportsController.getReportById);

router.post('/',
  [
    body('title').notEmpty().trim().isLength({ min: 3, max: 255 }),
    body('type').isIn(['financial', 'operational', 'safety', 'performance']),
    body('summary').optional().trim()
  ],
  reportsController.createReport
);

router.put('/:id',
  authorizeRole('admin', 'manager'),
  [
    body('title').optional().trim().isLength({ min: 3, max: 255 }),
    body('type').optional().isIn(['financial', 'operational', 'safety', 'performance']),
    body('status').optional().isIn(['draft', 'published'])
  ],
  reportsController.updateReport
);

router.delete('/:id',
  authorizeRole('admin'),
  reportsController.deleteReport
);

module.exports = router;
