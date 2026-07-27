const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', tableController.list);
router.get('/:id', tableController.getById);
router.post('/', authorize('admin', 'manager'), tableController.create);
router.patch('/:id', authorize('admin', 'manager', 'host'), tableController.update);
router.delete('/:id', authorize('admin'), tableController.delete);

module.exports = router;
