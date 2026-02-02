const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const nodemailer = require('nodemailer');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200:
 *         description: User registered successfully
 */
router.post('/signup', async (req, res) => {
  const { username, phone, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const [result] = await pool.query(
      'INSERT INTO users (username, phone, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [username, phone, email, hashedPassword, role || 'user']
    );
    res.json({ message: 'User registered successfully', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user with phone or email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 */
router.post('/login', async (req, res) => {
  const { phone, email, password } = req.body;

  let query, value;
  if (phone) {
    query = 'SELECT * FROM users WHERE phone = ?';
    value = phone;
  } else if (email) {
    query = 'SELECT * FROM users WHERE email = ?';
    value = email;
  } else {
    return res.status(400).json({ error: 'Phone or email required' });
  }

  const [rows] = await pool.query(query, [value]);
  const user = rows[0];
  if (!user) return res.status(400).json({ error: 'User not found' });
  if (user.disabled) return res.status(403).json({ error: 'Account disabled' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, 'secretkey');
  res.json({ token });
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset (send OTP to email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: OTP sent to email
 */
router.post('/forgot-password', async (req, res) => {
  const { phone } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
  const user = rows[0];
  if (!user) return res.status(400).json({ error: 'User not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60000);

  await pool.query(
    'INSERT INTO password_resets (userId, otp, expiresAt) VALUES (?, ?, ?)',
    [user.id, otp, expiresAt]
  );

  // Send OTP via email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'yourgmail@gmail.com',
      pass: 'your-app-password'
    }
  });

  await transporter.sendMail({
    from: 'yourgmail@gmail.com',
    to: user.email,
    subject: 'Klara Coffee OTP',
    text: `Your OTP is ${otp}. It expires in 10 minutes.`
  });

  res.json({ message: 'OTP sent to email address' });
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone: { type: string }
 *               otp: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
  const user = rows[0];
  if (!user) return res.status(400).json({ error: 'User not found' });

  const [resetRows] = await pool.query(
    'SELECT * FROM password_resets WHERE userId = ? AND otp = ? AND expiresAt > NOW()',
    [user.id, otp]
  );
  const reset = resetRows[0];
  if (!reset) return res.status(400).json({ error: 'Invalid or expired OTP' });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

  await pool.query('DELETE FROM password_resets WHERE id = ?', [reset.id]);

  res.json({ message: 'Password reset successful' });
});

module.exports = router;
