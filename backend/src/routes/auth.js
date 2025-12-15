import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../schema/user.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'brand' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'email in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role });
    const token = jwt.sign({ userId: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ userId: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
// Authenticated current user endpoint
import { verifyToken } from '../util/auth.js';
router.get('/me', verifyToken, async (req, res) => {
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json({ user: { id: user._id, email: user.email, role: user.role, socialAccounts: user.socialAccounts } });
});
