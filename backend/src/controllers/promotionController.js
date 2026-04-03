import { db } from '../config/db.js';

export const getActivePromotions = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, code, title, type, value, minimum_order, starts_at, ends_at
       FROM promotions
       WHERE is_active = 1
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY id DESC`,
    );

    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch promotions:', error);
    res.status(500).json({ message: 'Failed to fetch promotions' });
  }
};

export const validatePromotion = async (req, res) => {
  try {
    const code = String(req.body?.code || '')
      .trim()
      .toUpperCase();
    const subtotal = Number(req.body?.subtotal || 0);

    if (!code) {
      return res.status(400).json({ message: 'Promotion code is required' });
    }

    const [rows] = await db.query(
      `SELECT id, code, title, type, value, minimum_order
       FROM promotions
       WHERE code = ?
         AND is_active = 1
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at IS NULL OR ends_at >= NOW())
       LIMIT 1`,
      [code],
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ message: 'Promotion not found or expired' });
    }

    const promo = rows[0];
    if (subtotal < Number(promo.minimum_order || 0)) {
      return res.status(400).json({
        message: `Minimum order for this promo is ₱${Number(
          promo.minimum_order || 0,
        ).toFixed(2)}`,
      });
    }

    const discountAmount =
      promo.type === 'percent'
        ? subtotal * (Number(promo.value) / 100)
        : Number(promo.value);

    return res.json({
      code: promo.code,
      title: promo.title,
      type: promo.type,
      value: Number(promo.value),
      discountAmount: Math.min(discountAmount, subtotal),
    });
  } catch (error) {
    console.error('Failed to validate promotion:', error);
    res.status(500).json({ message: 'Failed to validate promotion' });
  }
};
