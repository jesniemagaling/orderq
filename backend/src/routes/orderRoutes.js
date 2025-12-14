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
  retractOrder,
  getOrderAudit,
} from '../controllers/orderController.js';

const router = express.Router();

// Order creation & confirmation
router.post('/', createOrder);
router.post('/:id/confirm', confirmOrder);

// GET routes
router.get('/logs', getOrderAudit);
router.get('/by-session', getOrdersBySession);
router.get('/', getAllOrders);
router.get('/:id', getOrderDetails);

// PUT routes
router.put('/:id/pay', markOrderAsPaid);
router.put('/:id/serve', markOrderAsServed);
router.put('/:orderId/cancel', cancelOrder);
router.put('/:id/retract', retractOrder);

export default router;
