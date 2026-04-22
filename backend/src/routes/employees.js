const express = require('express');
const { body } = require('express-validator');
const employeesController = require('../controllers/employeesController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', employeesController.getAllEmployees);
router.get('/stats', employeesController.getPayrollStats);
router.get('/:id', employeesController.getEmployeeById);

router.post('/',
  authorizeRole('admin', 'manager'),
  [
    body('name').notEmpty().trim().isLength({ min: 2, max: 255 }),
    body('role').notEmpty().trim(),
    body('department').notEmpty().trim(),
    body('base_salary').isFloat({ min: 0 }),
    body('deductions').optional().isFloat({ min: 0 }),
    body('bonuses').optional().isFloat({ min: 0 }),
    body('payment_status').optional().isIn(['paid', 'pending', 'overdue']),
    body('pay_period').optional().isIn(['monthly', 'weekly'])
  ],
  employeesController.createEmployee
);

router.put('/:id',
  authorizeRole('admin', 'manager'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('base_salary').optional().isFloat({ min: 0 }),
    body('payment_status').optional().isIn(['paid', 'pending', 'overdue'])
  ],
  employeesController.updateEmployee
);

router.post('/process-payroll',
  authorizeRole('admin'),
  employeesController.processPayroll
);

router.delete('/:id',
  authorizeRole('admin'),
  employeesController.deleteEmployee
);

// Bulk operations
router.post('/bulk',
  authorizeRole('admin', 'manager'),
  employeesController.bulkCreateEmployees
);

router.put('/bulk',
  authorizeRole('admin', 'manager'),
  employeesController.bulkUpdateEmployees
);

router.delete('/bulk',
  authorizeRole('admin'),
  employeesController.bulkDeleteEmployees
);

module.exports = router;
