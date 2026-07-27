const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/revenue', analyticsController.getRevenueData);
router.get('/top-items', analyticsController.getTopItems);
router.get('/payment-distribution', analyticsController.getPaymentDistribution);
router.get('/peak-hours', analyticsController.getPeakHours);
router.get('/order-trends', analyticsController.getOrderTrends);
router.get('/ai-insights', analyticsController.getAIInsights);

module.exports = router;
