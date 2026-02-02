const { verifyToken, isAdmin } = require('../middleware/auth');

// Disable user
router.put('/disable/:id', verifyToken, isAdmin, async (req, res) => {
  await pool.query('UPDATE users SET disabled = true WHERE id = ?', [req.params.id]);
  res.json({ message: 'User disabled successfully' });
});

// Enable user
router.put('/enable/:id', verifyToken, isAdmin, async (req, res) => {
  await pool.query('UPDATE users SET disabled = false WHERE id = ?', [req.params.id]);
  res.json({ message: 'User enabled successfully' });
});
