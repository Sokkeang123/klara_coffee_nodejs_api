const express = require('express');
const pool = require('../db');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Menu management endpoints
 */

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Get all menu items
 *     tags: [Menu]
 *     responses:
 *       200:
 *         description: List of menu items
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/menu:
 *   post:
 *     summary: Add a new menu item (Admin only)
 *     tags: [Menu]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               category: { type: string }
 *               isSpecial: { type: boolean }
 *     responses:
 *       200:
 *         description: Menu item created
 */
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name, description, price, category, isSpecial } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO menu_items (name, description, price, category, isSpecial) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, category, isSpecial]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/menu/{id}:
 *   put:
 *     summary: Update a menu item (Admin only)
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               category: { type: string }
 *               isSpecial: { type: boolean }
 *     responses:
 *       200:
 *         description: Menu item updated
 */
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { name, description, price, category, isSpecial } = req.body;
  try {
    await pool.query(
      'UPDATE menu_items SET name=?, description=?, price=?, category=?, isSpecial=? WHERE id=?',
      [name, description, price, category, isSpecial, req.params.id]
    );
    res.json({ message: 'Menu item updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/menu/{id}:
 *   delete:
 *     summary: Delete a menu item (Admin only)
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Menu item deleted
 */
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM menu_items WHERE id=?', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/**
 * @swagger
 * /api/menu/search:
 *   get:
 *     summary: Search menu items by name or category
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword (name or category)
 *     responses:
 *       200:
 *         description: Matching menu items
 */
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query required' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM menu_items WHERE name LIKE ? OR category LIKE ?',
      [`%${q}%`, `%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
