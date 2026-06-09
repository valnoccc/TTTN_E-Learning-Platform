const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seed() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3RAn3h6KN29y4p7.root',
    password: '4GnyOM0eggS0zlaf',
    database: 'db_tttn',
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
