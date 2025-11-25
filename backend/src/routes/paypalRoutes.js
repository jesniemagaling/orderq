import express from 'express';
import { handleCreatePaypalOrder } from '../controllers/paypalController.js';

const router = express.Router();

router.post('/create-order', handleCreatePaypalOrder);

export default router;
