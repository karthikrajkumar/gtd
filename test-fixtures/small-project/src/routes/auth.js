const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashedPassword, name });
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ user: { id: user.id, email, name }, token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

module.exports = router;
