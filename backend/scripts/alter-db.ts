import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'edumeo',
    ssl: process.env.DB_HOST?.includes('tidbcloud.com') ? {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    } : undefined
  });

  try {
    console.log('Adding KetQuaHocTap column...');
    await connection.execute(`
      ALTER TABLE KhoaHoc 
      ADD COLUMN KetQuaHocTap TEXT NULL
    `);
    console.log('KetQuaHocTap added.');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('KetQuaHocTap already exists.');
    } else {
      console.error(err);
    }
  }

  try {
    console.log('Adding YeuCauKhoaHoc column...');
    await connection.execute(`
      ALTER TABLE KhoaHoc 
      ADD COLUMN YeuCauKhoaHoc TEXT NULL
    `);
    console.log('YeuCauKhoaHoc added.');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('YeuCauKhoaHoc already exists.');
    } else {
      console.error(err);
    }
  }

  // Add dummy data for Course 1
  try {
    console.log('Updating course 1 with sample data...');
    const sampleKetQua = JSON.stringify([
      "Handle advanced techniques like Dimensionality Reduction",
      "Reinforcement learning upper confidence bound Thompson sampling",
      "Handle specific topics like Reinforcement Learning best",
      "Model Selection and Boosting fold cross validation parameter",
      "Know which Machine Learning model to choose for each type of problem",
      "Use Machine Learning for personal purpose of machine"
    ]);
    const sampleYeuCau = JSON.stringify([
      "High School Mathematics Level",
      "Basic Python Knowledge Required",
      "Broadband Internet"
    ]);

    await connection.execute(`
      UPDATE KhoaHoc
      SET KetQuaHocTap = ?, YeuCauKhoaHoc = ?
      WHERE MaKH = 1 OR MaKH = 6004
    `, [sampleKetQua, sampleYeuCau]);
    console.log('Course data updated.');
  } catch (err) {
    console.error('Failed to update course data:', err);
  }

  await connection.end();
}

run();
