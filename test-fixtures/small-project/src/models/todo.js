// Todo model — simplified for test fixture (simulates Prisma client)
const todos = [];

const Todo = {
  async create({ title, description, priority, userId }) {
    const todo = { id: todos.length + 1, title, description, priority, userId, completed: false, createdAt: new Date() };
    todos.push(todo);
    return todo;
  },
  async findByUserId(userId) { return todos.filter((t) => t.userId === userId); },
  async update(id, data) { const t = todos.find((t) => t.id === Number(id)); return t ? Object.assign(t, data) : null; },
  async delete(id) { const i = todos.findIndex((t) => t.id === Number(id)); if (i >= 0) todos.splice(i, 1); },
  async toggleComplete(id) { const t = todos.find((t) => t.id === Number(id)); t.completed = !t.completed; return t; },
};

module.exports = { Todo };
