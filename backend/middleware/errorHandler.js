function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  
  res.status(status).json({
    message: message,
  });
}

module.exports = errorHandler;
