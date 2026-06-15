const mysql = require('mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3RAn3h6KN29y4p7.root',
    password: 'JcT3wP4cBgzOyaIF',
    database: 'db_lvtn',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });
  try {
    const [t] = await conn.query("SELECT MaBH, MaKH, TenBaiHoc, VideoURL FROM BaiHoc WHERE TenBaiHoc LIKE '%Dataset trên Roboflow%'");
    console.log(t);
  } catch(e) {
    console.error(e);
  } finally {
    conn.end();
  }
}
main();
