const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connected to TiDB...');

    // Get an existing User ID
    const [users] = await connection.execute('SELECT MaND FROM NguoiDung LIMIT 1');
    if (users.length === 0) {
      console.log('No user found in DB. Cannot seed questions.');
      process.exit(1);
    }
    const authorId = users[0].MaND;

    // Create tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS TheTuDienDan (
        MaThe INT AUTO_INCREMENT PRIMARY KEY,
        TenThe VARCHAR(255) NOT NULL UNIQUE,
        DuongDan VARCHAR(255) NOT NULL
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS CauHoiDienDan (
        MaCH INT AUTO_INCREMENT PRIMARY KEY,
        TieuDe VARCHAR(255) NOT NULL,
        NoiDung TEXT NOT NULL,
        MaND_TacGia INT,
        LuotXem INT DEFAULT 0,
        LuotBinhChon INT DEFAULT 0,
        SoCauTraLoi INT DEFAULT 0,
        NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
        NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS CauHoi_TheTu (
        MaCH INT,
        MaThe INT,
        PRIMARY KEY (MaCH, MaThe)
      )
    `);

    // Insert Tags
    await connection.execute(`INSERT IGNORE INTO TheTuDienDan (TenThe, DuongDan) VALUES ('react', 'react'), ('nestjs', 'nestjs'), ('c#', 'c-sharp'), ('java', 'java')`);
    console.log('Inserted tags.');

    const [tags] = await connection.execute('SELECT MaThe, TenThe FROM TheTuDienDan LIMIT 4');
    const tagIds = tags.map(t => t.MaThe);

    // Insert Questions
    const questions = [
      {
        title: 'Cách setup TypeORM với NestJS kết nối TiDB?',
        content: 'Chào mọi người, mình đang cố gắng kết nối NestJS với TiDB sử dụng TypeORM nhưng gặp lỗi SSL. Mọi người cho mình xin cách cấu hình chuẩn với ạ.',
        views: 120,
        votes: 5,
        answers: 1
      },
      {
        title: 'Làm sao để custom giao diện Navbar trong React mà không bị re-render?',
        content: 'Mình đang có một trang React, khi cuộn trang thì Header thay đổi màu nền (sticky menu). Nhưng nó bị giật do re-render liên tục. Có cách nào tối ưu không?',
        views: 45,
        votes: 2,
        answers: 0
      },
      {
        title: 'Lỗi "OSError: [WinError 193] %1 is not a valid Win32 application" khi gọi file .dll',
        content: 'Mình đang gọi thư viện C++ .dll trong Python bằng ctypes trên Windows 64-bit nhưng liên tục bị báo lỗi. Ai từng gặp lỗi này chỉ mình với?',
        views: 200,
        votes: 10,
        answers: 3
      }
    ];

    for (const q of questions) {
      const [result] = await connection.execute(
        `INSERT INTO CauHoiDienDan (TieuDe, NoiDung, LuotXem, LuotBinhChon, SoCauTraLoi, MaND_TacGia) VALUES (?, ?, ?, ?, ?, ?)`,
        [q.title, q.content, q.views, q.votes, q.answers, authorId]
      );
      const questionId = result.insertId;

      // Assign tags to question
      // Randomly assign 2 tags
      const assignedTags = [tagIds[0], tagIds[1]]; // Just pick first 2 for simplicity
      for (const tId of assignedTags) {
        await connection.execute(
          `INSERT INTO CauHoi_TheTu (MaCH, MaThe) VALUES (?, ?)`,
          [questionId, tId]
        );
      }
    }

    console.log('Inserted questions successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

seed();
