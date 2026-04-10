/**
 * Todo API — Express application entry point.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/error-handler');
const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const userRoutes = require('./routes/users');
const healthRoutes = require('./routes/health');
const tagRoutes = require('./routes/tags');

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }),
);

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);

// Protected routes
app.use('/api/todos', authMiddleware, todoRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/tags', authMiddleware, tagRoutes);

// Error handling
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Todo API running on port ${PORT}`);
  });
}

module.exports = app;
