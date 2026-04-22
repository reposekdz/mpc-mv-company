const express = require('express');
const { body } = require('express-validator');
const trucksController = require('../controllers/trucksController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', trucksController.getAllTrucks);
router.get('/stats', trucksController.getTruckStats);
router.get('/:id', trucksController.getTruckById);

router.post('/',
  authorizeRole('admin', 'manager'),
  [
    body('name').notEmpty().trim().isLength({ min: 2, max: 255 }),
    body('plate_number').notEmpty().trim(),
    body('status').optional().isIn(['available', 'in_use', 'maintenance', 'out_of_service']),
    body('fuel_level').optional().isInt({ min: 0, max: 100 }),
    body('mileage').optional().isInt({ min: 0 })
  ],
  trucksController.createTruck
);

router.put('/:id',
  authorizeRole('admin', 'manager'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('status').optional().isIn(['available', 'in_use', 'maintenance', 'out_of_service']),
    body('fuel_level').optional().isInt({ min: 0, max: 100 }),
    body('mileage').optional().isInt({ min: 0 })
  ],
  trucksController.updateTruck
);

router.delete('/:id',
  authorizeRole('admin'),
  trucksController.deleteTruck
);

// Bulk operations
router.post('/bulk',
  authorizeRole('admin', 'manager'),
  trucksController.bulkCreateTrucks
);

router.put('/bulk',
  authorizeRole('admin', 'manager'),
  trucksController.bulkUpdateTrucks
);

router.delete('/bulk',
  authorizeRole('admin'),
  trucksController.bulkDeleteTrucks
);

module.exports = router;
