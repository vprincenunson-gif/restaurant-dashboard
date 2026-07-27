const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', inventoryController.list);
router.get('/low-stock', inventoryController.getLowStockAlerts);
router.get('/:id', inventoryController.getById);
router.post('/', authorize('admin', 'manager'), inventoryController.create);
router.patch('/:id', authorize('admin', 'manager'), inventoryController.update);
router.patch('/:id/stock', authorize('admin', 'manager', 'staff'), inventoryController.adjustStock);
router.delete('/:id', authorize('admin'), inventoryController.delete);

module.exports = router;
