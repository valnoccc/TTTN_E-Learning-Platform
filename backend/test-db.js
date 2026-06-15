const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '3RAn3h6KN29y4p7.root',
  password: 'JcT3wP4cBgzOyaIF',
  database: 'db_lvtn',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

connection.query('DESCRIBE KhoaHoc', (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('KhoaHoc table:');
  console.table(results);
  process.exit(0);
});
