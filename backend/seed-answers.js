const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
  });

  await c.execute(`
    CREATE TABLE IF NOT EXISTS CauTraLoiDienDan (
      MaCTL INT AUTO_INCREMENT PRIMARY KEY,
      NoiDung TEXT NOT NULL,
      LuotBinhChon INT DEFAULT 0,
      LaDapAnDung BOOLEAN DEFAULT FALSE,
      NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
      NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      MaND INT,
      MaCH INT,
      FOREIGN KEY (MaCH) REFERENCES CauHoiDienDan(MaCH) ON DELETE CASCADE
    )
  `);

  await c.execute(`
    INSERT INTO CauTraLoiDienDan (NoiDung, LuotBinhChon, MaND, MaCH)
    VALUES
      ('Mình cũng từng gặp lỗi này. Bạn thử cấu hình rejectUnauthorized: false trong ssl options xem sao.', 2, 1, 1),
      ('Có thể do phiên bản Node.js của bạn. Thử nâng cấp lên v18 nhé.', 0, 2, 1)
  `);

  await c.execute('UPDATE CauHoiDienDan SET SoCauTraLoi = 2 WHERE MaCH = 1');
  
  console.log('Done creating answers table');
  process.exit(0);
}

run().catch(console.error);
