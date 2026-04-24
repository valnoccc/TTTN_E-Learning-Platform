import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { KhoaHoc } from './entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(KhoaHoc)
    private khoaHocRepository: Repository<KhoaHoc>,
    private dataSource: DataSource,
  ) { }

  async getCoursesByInstructor(instructorId: number) {
    return await this.khoaHocRepository.find({
      where: { id_giang_vien: instructorId },
      order: { ngay_tao: 'DESC' }
    });
  }

  async createCourse(payload: any) {
    const newCourse = this.khoaHocRepository.create(payload);
    return await this.khoaHocRepository.save(newCourse);
  }

  async remove(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { id: courseId, id_giang_vien: instructorId }
    });

    if (!course) throw new ForbiddenException('Bạn không có quyền xóa khóa học này');

    const hasBuyers = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM chitiethoadon WHERE id_khoa_hoc = ?`,
      [courseId]
    );

    if (hasBuyers[0].count > 0) {
      await this.khoaHocRepository.update(courseId, { trang_thai: 'HIDDEN' });
      return { message: 'Khóa học đã có học viên mua, hệ thống đã chuyển sang trạng thái ẨN.' };
    }

    await this.khoaHocRepository.delete(courseId);
    return { message: 'Đã xóa khóa học thành công.' };
  }

  async updateCourseStatus(courseId: number, instructorId: number, trang_thai: string) {
    const course = await this.khoaHocRepository.findOne({
      where: { id: courseId, id_giang_vien: instructorId }
    });

    if (!course) throw new ForbiddenException('Bạn không có quyền sửa khóa học này');

    await this.khoaHocRepository.update(courseId, { trang_thai });
    return { message: 'Cập nhật trạng thái thành công' };
  }

  // ========================================================
  // HÀM LẤY CHI TIẾT 1 KHÓA HỌC (Để hiển thị lên Form sửa)
  // ========================================================
  async getCourseById(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { id: courseId, id_giang_vien: instructorId }
    });

    if (!course) {
      throw new ForbiddenException('Không tìm thấy khóa học hoặc bạn không có quyền truy cập');
    }
    return course;
  }

  // ========================================================
  // HÀM CẬP NHẬT KHÓA HỌC THẬT SỰ
  // ========================================================
  async updateCourse(courseId: number, instructorId: number, payload: any) {
    // 1. Kiểm tra quyền sở hữu
    const course = await this.khoaHocRepository.findOne({
      where: { id: courseId, id_giang_vien: instructorId }
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền sửa khóa học này');
    }

    // 2. Thực hiện lệnh UPDATE xuống Database
    await this.khoaHocRepository.update(courseId, payload);

    // 3. Trả về dữ liệu mới sau khi đã cập nhật
    return await this.khoaHocRepository.findOne({ where: { id: courseId } });
  }
}