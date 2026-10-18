class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  // Log only the message, never credentials; send a generic response
  console.error('Unhandled error:', err.name, err.code || '', err.message || '');
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { HttpError, notFound, errorHandler };
