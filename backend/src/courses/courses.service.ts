import { ForbiddenException, BadRequestException, Injectable } from '@nestjs/common';
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
      where: { maND_GiangVien: instructorId },
      order: { maKH: 'DESC' }
    });
  }

  async createCourse(payload: any) {
    const newCourse = this.khoaHocRepository.create(payload);
    return await this.khoaHocRepository.save(newCourse);
  }

  async remove(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId }
    });

    if (!course) throw new ForbiddenException('Bạn không có quyền xóa khóa học này');

    const hasBuyers = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ChiTietHoaDon WHERE MaKH = ?`,
      [courseId]
    );

    if (hasBuyers[0].count > 0) {
      await this.khoaHocRepository.update(courseId, { trangThai: 'HIDDEN' });
      return { message: 'Khóa học đã có học viên mua, hệ thống đã chuyển sang trạng thái ẨN.' };
    }

    await this.khoaHocRepository.delete(courseId);
    return { message: 'Đã xóa khóa học thành công.' };
  }

  async updateCourseStatus(courseId: number, instructorId: number, trangThai: string) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId }
    });

    if (!course) throw new ForbiddenException('Bạn không có quyền sửa khóa học này');

    // --- BỔ SUNG RÀNG BUỘC KIỂM DUYỆT Ở ĐÂY ---
    if (trangThai === 'PENDING') {
      // Đếm số lượng bài học của khóa học này trong bảng baihoc
      const lessonCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM BaiHoc WHERE MaKH = ?`,
        [courseId]
      );

      if (Number(lessonCount[0].count) === 0) {
        throw new BadRequestException('Khóa học chưa hoàn thiện. Cần ít nhất 1 bài học để gửi duyệt!');
      }
    }
    await this.khoaHocRepository.update(courseId, { trangThai });
    return { message: 'Cập nhật trạng thái thành công' };
  }

  // ========================================================
  // HÀM LẤY CHI TIẾT 1 KHÓA HỌC (Để hiển thị lên Form sửa)
  // ========================================================
  async getCourseById(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId }
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
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId }
    });

    if (!course) throw new ForbiddenException('Bạn không có quyền sửa khóa học này');

    // Cập nhật các trường, bao gồm hinhThuNho
    Object.assign(course, payload);

    return await this.khoaHocRepository.save(course);
  }
}
