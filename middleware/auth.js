const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, 'secretkey');
    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function isAdmin(req, res, next) {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = { verifyToken, isAdmin };
