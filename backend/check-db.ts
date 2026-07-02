import 'dotenv/config';
import AppDataSource from './src/database/data-source';

async function main() {
  await AppDataSource.initialize();
  console.log('DB Initialized');
  
  // Create table if not exists
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS ThaoLuan_LuotThich (
      MaThaoLuan INT NOT NULL,
      MaND INT NOT NULL,
      ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (MaThaoLuan, MaND)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Table ThaoLuan_LuotThich created or already exists');

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
