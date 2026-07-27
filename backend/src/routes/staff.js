const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', staffController.list);
router.get('/stats', staffController.getStats);
router.get('/:id', staffController.getById);
router.post('/', authorize('admin', 'manager'), staffController.create);
router.patch('/:id', authorize('admin', 'manager'), staffController.update);
router.delete('/:id', authorize('admin'), staffController.delete);

module.exports = router;
