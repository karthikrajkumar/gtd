function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
