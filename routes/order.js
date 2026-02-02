const express = require('express');
const pool = require('../db');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: integer }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: integer }
 *                     quantity: { type: integer }
 *               totalCost: { type: number }
 *               deliveryMethod: { type: string }
 *               paymentMethod: { type: string }
 *     responses:
 *       200:
 *         description: Order placed successfully
 */
router.post('/', async (req, res) => {
  const { userId, items, totalCost, deliveryMethod, paymentMethod } = req.body;

  try {
    const [orderResult] = await pool.query(
      'INSERT INTO orders (userId, totalCost, deliveryMethod, paymentMethod) VALUES (?, ?, ?, ?)',
      [userId, totalCost, deliveryMethod, paymentMethod]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (orderId, productId, quantity) VALUES (?, ?, ?)',
        [orderId, item.productId, item.quantity]
      );
    }

    res.json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/orders/{userId}:
 *   get:
 *     summary: Get all orders for a user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of user orders
 */
router.get('/:userId', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE userId = ?', [req.params.userId]);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
