// User model — simplified for test fixture (simulates Prisma client)
const users = [];

const User = {
  async create({ email, password, name }) {
    const user = { id: users.length + 1, email, password, name, createdAt: new Date() };
    users.push(user);
    return user;
  },
  async findByEmail(email) { return users.find((u) => u.email === email) || null; },
  async findById(id) { return users.find((u) => u.id === id) || null; },
  async update(id, data) { const u = users.find((u) => u.id === id); return Object.assign(u, data); },
};

module.exports = { User };
