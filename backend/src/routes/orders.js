const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', orderController.list);
router.get('/status-counts', orderController.getStatusCounts);
router.get('/:id', orderController.getById);
router.post('/', orderController.create);
router.patch('/:id/status', orderController.updateStatus);
router.put('/:id', orderController.update);
router.delete('/:id', authorize('admin', 'manager'), orderController.delete);

module.exports = router;
