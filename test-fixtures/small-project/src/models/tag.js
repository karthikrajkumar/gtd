// Tag model — simplified for test fixture
const tags = [];

const Tag = {
  async create({ name, userId }) {
    const tag = { id: tags.length + 1, name, userId, createdAt: new Date() };
    tags.push(tag);
    return tag;
  },
  async findByUserId(userId) { return tags.filter((t) => t.userId === userId); },
};

module.exports = { Tag };
