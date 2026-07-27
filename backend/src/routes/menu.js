const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Categories
router.get('/categories', menuController.listCategories);
router.post('/categories', authorize('admin', 'manager'), menuController.createCategory);

// Items
router.get('/items', menuController.listItems);
router.post('/items', authorize('admin', 'manager'), menuController.createItem);
router.patch('/items/:id', authorize('admin', 'manager'), menuController.updateItem);
router.delete('/items/:id', authorize('admin'), menuController.deleteItem);

module.exports = router;
