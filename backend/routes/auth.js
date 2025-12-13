const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models');
const { authLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to auth routes
router.use(authLimiter);

// Helper to generate JWT
function signToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, accountType } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = await User.create({ 
      email, 
      password, 
      name,
      accountType: accountType || 'brand',
      'security.lastPasswordChange': new Date()
    });
    const token = signToken(user);
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        accountType: user.accountType,
        subscription: user.subscription
      } 
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await user.comparePassword(password);
    if (!match) {
      // Increment failed attempts
      await user.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts on successful login
    if (user.security.failedLoginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    const token = signToken(user);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name,
        accountType: user.accountType,
        onboardingComplete: user.onboardingComplete,
        subscription: user.subscription
      } 
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me (requires Authorization header Bearer <token>)
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    const payload = jwt.verify(parts[1], process.env.JWT_SECRET);
    res.json({ userId: payload.userId, email: payload.email });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
