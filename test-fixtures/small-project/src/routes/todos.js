const express = require('express');
const router = express.Router();
const { Todo } = require('../models/todo');

router.get('/', async (req, res) => {
  const todos = await Todo.findByUserId(req.userId);
  res.json(todos);
});

router.post('/', async (req, res) => {
  const { title, description, priority } = req.body;
  const todo = await Todo.create({ title, description, priority, userId: req.userId });
  res.status(201).json(todo);
});

router.put('/:id', async (req, res) => {
  const todo = await Todo.update(req.params.id, req.body);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

router.delete('/:id', async (req, res) => {
  await Todo.delete(req.params.id);
  res.status(204).send();
});

router.patch('/:id/complete', async (req, res) => {
  const todo = await Todo.toggleComplete(req.params.id);
  res.json(todo);
});

module.exports = router;
