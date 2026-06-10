const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seed() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  console.log('Reading init_schema.sql...');
  const sql = fs.readFileSync(path.join(__dirname, '../database/init_schema.sql'), 'utf8');

  console.log('Executing schema...');
  try {
    await connection.query(sql);
    console.log('Schema initialized successfully!');
  } catch (err) {
    console.error('Failed to execute schema:', err);
  } finally {
    await connection.end();
  }
}

seed();
