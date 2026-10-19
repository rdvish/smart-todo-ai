require('dotenv').config();
const { Pool } = require('pg'); //PostgreSQL client for Node.js


const LOCAL_DB_URL = 'postgresql://postgres:postgres@localhost:5432/smart_todo_ai'; 


const url = process.env.DATABASE_URL || LOCAL_DB_URL;


const isRailway = url.includes('railway.app') || url.includes('railway.internal');

const pool = new Pool({
  connectionString: url,
  // Force SSL on Railway, disable it on localhost
  ssl: isRailway ? { rejectUnauthorized: false } : false,
});

module.exports = pool;