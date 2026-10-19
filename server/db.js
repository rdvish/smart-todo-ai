require('dotenv').config();
const { Pool } = require('pg');

const url = process.env.DATABASE_URL;
const isLocalHost = !url || url.includes('localhost') || url.includes('127.0.0.1');

const pool = new Pool({
  connectionString: url,
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
});

module.exports = pool;