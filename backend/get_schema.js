const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
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

  try {
    const tables = ['HoaDon', 'ChiTietHoaDon', 'DangKyKhoaHoc', 'MaGiamGia', 'NguoiDung'];
    for (const table of tables) {
      const [results] = await connection.query(`DESCRIBE ${table}`);
      console.log(`\nTable: ${table}`);
      console.table(results);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();
