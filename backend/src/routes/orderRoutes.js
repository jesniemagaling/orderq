import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderDetails,
  getOrdersBySession,
  markOrderAsPaid,
  confirmOrder,
  cancelOrder,
  markOrderAsServed,
  getSalesGraph,
  getRevenueByRange,
  getActiveOrdersCount,
} from '../controllers/orderController.js';

const router = express.Router();

// Order creation & confirmation
router.post('/', createOrder);
router.post('/:id/confirm', confirmOrder);

// GET routes
router.get('/', getAllOrders);
router.get('/sales-graph', getSalesGraph);
router.get('/revenue', getRevenueByRange);
router.get('/by-session', getOrdersBySession);
router.get('/:id', getOrderDetails);
router.get('/active-count', getActiveOrdersCount);

// PUT routes
router.put('/:id/pay', markOrderAsPaid);
router.put('/:id/serve', markOrderAsServed);
router.put('/:orderId/cancel', cancelOrder);

export default router;
