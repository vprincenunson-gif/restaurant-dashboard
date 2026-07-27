const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', saleController.list);
router.get('/today', saleController.getTodaySummary);
router.get('/:id', saleController.getById);
router.post('/', authorize('admin', 'manager'), saleController.create);
router.patch('/:id', authorize('admin', 'manager'), saleController.update);
router.patch('/:id/void', authorize('admin'), saleController.voidSale);

module.exports = router;
