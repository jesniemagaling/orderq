import express from 'express';
import {
  getDailyIncome,
  getOrdersPerDay,
  getOrdersPerTable,
  getItemSales,
  getSalesPerDay,
  getSalesSummary,
  getPaymentBreakdown,
  getHourlyHeatmap,
  getCategorySales,
} from '../controllers/salesController.js';

const router = express.Router();

router.get('/daily-income', getDailyIncome);
router.get('/orders-per-day', getOrdersPerDay);
router.get('/orders-per-table', getOrdersPerTable);
router.get('/items', getItemSales);
router.get('/sales-per-day', getSalesPerDay);
router.get('/summary', getSalesSummary);
router.get('/payment-breakdown', getPaymentBreakdown);
router.get('/hourly-heatmap', getHourlyHeatmap);
router.get('/category-sales', getCategorySales);

export default router;
