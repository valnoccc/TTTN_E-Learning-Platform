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
    const [t] = await conn.query(`
      SELECT 
        k.MaKH as id, 
        k.TenKhoaHoc as title, 
        k.HinhThuNho as image, 
        IFNULL(
          ROUND(
            (
              SELECT COUNT(*) 
              FROM TienDoHocTap t 
              JOIN BaiHoc b ON t.MaBH = b.MaBH 
              WHERE b.MaKH = k.MaKH AND t.MaND = d.MaND AND t.DaHoanThanh = 1
            ) * 100.0 / NULLIF((
              SELECT COUNT(*) 
              FROM BaiHoc b2 
              WHERE b2.MaKH = k.MaKH
            ), 0)
          , 0)
        , 0) as progress 
      FROM DangKyKhoaHoc d 
      JOIN KhoaHoc k ON d.MaKH = k.MaKH 
      WHERE d.MaND = ? AND d.TrangThai = 'ACTIVE'
    `, [1]);
    console.log(t);
  } catch(e) {
    console.error(e);
  } finally {
    conn.end();
  }
}
main();
