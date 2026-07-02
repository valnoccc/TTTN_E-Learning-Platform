import AppDataSource from './src/database/data-source';

async function main() {
  await AppDataSource.initialize();
  const res = await AppDataSource.query(`SHOW TABLES LIKE 'DanhGia%'`);
  console.log(res);
  await AppDataSource.destroy();
}

main().catch(console.error);
