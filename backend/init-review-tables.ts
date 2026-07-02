import * as dotenv from 'dotenv';
dotenv.config();
import AppDataSource from './src/database/data-source';

async function main() {
  await AppDataSource.initialize();
  console.log('Database initialized');

  // Tạo bảng DanhGiaHuuIch
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS DanhGiaHuuIch (
      MaDG INT NOT NULL,
      MaND INT NOT NULL,
      TrangThai INT NOT NULL COMMENT '1: Hữu ích, -1: Không hữu ích',
      PRIMARY KEY (MaDG, MaND)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Created DanhGiaHuuIch');

  // Tạo bảng DanhGiaBaoCao
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS DanhGiaBaoCao (
      MaDG INT NOT NULL,
      MaND INT NOT NULL,
      LyDo TEXT NOT NULL,
      ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (MaDG, MaND)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('Created DanhGiaBaoCao');

  await AppDataSource.destroy();
}

main().catch(console.error);
