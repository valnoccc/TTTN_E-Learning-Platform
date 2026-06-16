import { DataSource } from 'typeorm';

async function run() {
  const ds = new DataSource({
    type: 'mysql',
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    username: '3RAn3h6KN29y4p7.root',
    password: 'JcT3wP4cBgzOyaIF',
    database: 'db_lvtn',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  });
  await ds.initialize();
  const queryRunner = ds.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const courseIds = [1];
    const placeholders = courseIds.map(() => '?').join(',');
    const courses = await queryRunner.query(
      `SELECT MaKH, GiaBan, TenKhoaHoc FROM KhoaHoc WHERE MaKH IN (${placeholders})`,
      courseIds
    );
    const finalPrice = 1000;
    const userId = 1;
    const paymentMethod = 'MOMO';

    const insertHoaDonResult = await queryRunner.query(
      `INSERT INTO HoaDon (MaND, TongTien, TrangThaiThanhToan, PhuongThucThanhToan, MaCoupon)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, finalPrice, 'PAID', paymentMethod, null]
    );

    const invoiceId = insertHoaDonResult.insertId;

    for (const course of courses) {
      await queryRunner.query(
        `INSERT INTO ChiTietHoaDon (MaHD, MaKH, GiaGhiNhan) VALUES (?, ?, ?)`,
        [invoiceId, course.MaKH, Number(course.GiaBan || 0)]
      );

      await queryRunner.query(
        `INSERT INTO DangKyKhoaHoc (MaND, MaKH, MaHD, TrangThai) VALUES (?, ?, ?, ?)`,
        [userId, course.MaKH, invoiceId, 'ACTIVE']
      );
    }
    await queryRunner.commitTransaction();
    console.log('Success');
  } catch(e) {
    await queryRunner.rollbackTransaction();
    console.error('Error:', e);
  } finally {
    await queryRunner.release();
    await ds.destroy();
  }
}
run();
