const express = require('express');
const router = express.Router();
const { User } = require('../models/user');

router.get('/me', async (req, res) => {
  const user = await User.findById(req.userId);
  res.json({ id: user.id, email: user.email, name: user.name });
});

router.put('/me', async (req, res) => {
  const updated = await User.update(req.userId, req.body);
  res.json(updated);
});

module.exports = router;
