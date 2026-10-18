const express = require('express');
const helmet = require('helmet');
const tasksRoutes = require('./routes/tasks.routes');
const { notFound, errorHandler } = require('./middleware/error-handler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Health check for the load balancer: minimal, no secrets, no DB call
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/tasks', tasksRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
