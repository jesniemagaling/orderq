import express from 'express';
import {
  getMenu,
  getMenuById,
  getMenuCategories,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getTopSellingItems,
  logMenuHistory,
  getMenuHistory,
} from '../controllers/menuController.js';
import { verifyToken, verifyRole } from '../middlewares/authMiddleware.js';
import { body, validationResult } from 'express-validator';
import upload from '../middlewares/uploadMenuImage.js';

const router = express.Router();

// GET ROUTES
router.get('/', getMenu);
router.get('/top-selling', getTopSellingItems);
router.get('/categories', getMenuCategories);
router.get('/history', getMenuHistory);
router.get('/:id', getMenuById);

// ADD MENU ITEM
router.post(
  '/',
  upload.single('image'),
  [body('name').notEmpty(), body('price').isFloat({ gt: 0 })],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    addMenuItem(req, res);
  }
);

// UPDATE MENU ITEM
router.put(
  '/:id',
  upload.single('image'),
  [body('name').notEmpty(), body('price').isFloat({ gt: 0 })],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    updateMenuItem(req, res);
  }
);

// DELETE MENU ITEM
router.delete('/:id', (req, res) => {
  deleteMenuItem(req, res);
});

export default router;
