const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3RAn3h6KN29y4p7.root',
    password: '4GnyOM0eggS0zlaf',
    database: 'db_lvtn',
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });

  const [rows] = await connection.query('SELECT * FROM NguoiDung');
  console.log(rows);
  await connection.end();
}

check();
