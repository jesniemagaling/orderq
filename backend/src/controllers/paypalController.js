import { createPaypalOrder } from '../services/paypalService.js';

export const handleCreatePaypalOrder = async (req, res) => {
  try {
    const { totalAmount } = req.body;

    if (!totalAmount || isNaN(totalAmount) || Number(totalAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message:
          'totalAmount must be a positive number to create a PayPal order.',
      });
    }

    const order = await createPaypalOrder(Number(totalAmount));

    if (!order || !order.id) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create PayPal order: invalid response from PayPal.',
      });
    }

    return res.json({
      success: true,
      orderID: order.id,
      links: order.links || [],
    });
  } catch (error) {
    console.error('PayPal create-order error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create PayPal order',
      error: error.message,
    });
  }
};
