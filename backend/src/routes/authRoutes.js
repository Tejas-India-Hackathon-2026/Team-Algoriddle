import express from 'express';
import { loginUser, registerUser, verifyToken, logoutUser } from '../services/authService.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const result = loginUser(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const result = registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token;

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthenticated or session expired' });
  }

  res.json({ user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || req.body.token;

  logoutUser(token);
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
