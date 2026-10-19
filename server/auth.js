const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const pool = require('./db');
const requireAuth = require('./authMiddleware');

const router = express.Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again later' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const issueTokens = (userId) => ({
  accessToken: jwt.sign({ sub: userId, type: 'access' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
});

router.post('/register', limiter, async (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const password = String((req.body || {}).password || '');

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Enter a valid email' });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: 'Password must be 8 to 72 characters' });
  }

  try {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [id, email, hash]
    );
    res.status(201).json({ user: { id, email }, ...issueTokens(id) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', limiter, async (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const password = String((req.body || {}).password || '');

  try {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ user: { id: user.id, email: user.email }, ...issueTokens(user.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const payload = jwt.verify(String((req.body || {}).refreshToken || ''), process.env.JWT_REFRESH_SECRET);
    if (payload.type !== 'refresh') throw new Error('wrong token type');
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [payload.sub]);
    if (!rows[0]) throw new Error('user gone');
    res.json(issueTokens(payload.sub));
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.userId]);
  if (!rows[0]) return res.status(401).json({ error: 'User not found' });
  res.json({ user: rows[0] });
});

module.exports = router;