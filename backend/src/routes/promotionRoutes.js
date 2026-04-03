import express from 'express';
import {
  getActivePromotions,
  validatePromotion,
} from '../controllers/promotionController.js';

const router = express.Router();

router.get('/', getActivePromotions);
router.post('/validate', validatePromotion);

export default router;
