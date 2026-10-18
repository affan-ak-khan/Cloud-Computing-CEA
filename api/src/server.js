const env = require('./config/env');
const app = require('./app');

// 0.0.0.0 so the port is reachable from outside the container
const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`API listening on port ${env.PORT}`);
});

// Graceful shutdown so deployments don't drop in-flight requests
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
