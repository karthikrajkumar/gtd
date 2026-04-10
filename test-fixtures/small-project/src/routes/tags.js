const express = require('express');
const router = express.Router();
const { Tag } = require('../models/tag');

router.get('/', async (req, res) => {
  const tags = await Tag.findByUserId(req.userId);
  res.json(tags);
});

router.post('/', async (req, res) => {
  const tag = await Tag.create({ name: req.body.name, userId: req.userId });
  res.status(201).json(tag);
});

module.exports = router;
