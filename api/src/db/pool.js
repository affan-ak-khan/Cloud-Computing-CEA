const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // RDS PostgreSQL usually requires SSL, so DB_SSL=true will be set there
  ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
