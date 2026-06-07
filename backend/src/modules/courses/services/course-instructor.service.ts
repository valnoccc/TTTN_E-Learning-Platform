import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) { }

  async getCoursesByInstructor(instructorId: number) {
    return await this.khoaHocRepository.find({
      where: { maND_GiangVien: instructorId },
      order: { maKH: 'DESC' },
    });
  }

  async createCourse(payload: any, mucTieu: string[], yeuCau: string[]) {
    // 1. Lưu thông tin cơ bản của khóa học
    const newCourse = this.khoaHocRepository.create(payload);
    const savedCourse = await this.khoaHocRepository.save(newCourse);
    const courseId = (savedCourse as any).maKH;

    // 2. Chèn danh sách Mục tiêu khóa học
    if (mucTieu && mucTieu.length > 0) {
      for (const noiDung of mucTieu) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO MucTieuKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()]
          );
        }
      }
    }

    // 3. Chèn danh sách Yêu cầu khóa học
    if (yeuCau && yeuCau.length > 0) {
      for (const noiDung of yeuCau) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO YeuCauKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()]
          );
        }
      }
    }

    return savedCourse;
  }

  async remove(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền xóa khóa học này');
    }

    const hasBuyers = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ChiTietHoaDon WHERE MaKH = ?`,
      [courseId],
    );

    if (hasBuyers[0].count > 0) {
      await this.khoaHocRepository.update(courseId, { trangThai: 'DRAFT' });
      return {
        message:
          'Khóa học đã có học viên mua, hệ thống đã chuyển sang trạng thái ẩn.',
      };
    }

    await this.khoaHocRepository.delete(courseId);
    return { message: 'Đã xóa khóa học thành công.' };
  }

  async updateCourseStatus(
    courseId: number,
    instructorId: number,
    trangThai: string,
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền sửa khóa học này');
    }

    if (trangThai === 'PENDING') {
      const lessonCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM BaiHoc WHERE MaKH = ?`,
        [courseId],
      );

      if (Number(lessonCount[0].count) === 0) {
        throw new BadRequestException(
          'Khóa học chưa hoàn thiện. Cần ít nhất 1 bài học để gửi duyệt!',
        );
      }
    }

    await this.khoaHocRepository.update(courseId, { trangThai });
    return { message: 'Cập nhật trạng thái thành công' };
  }

  async getCourseById(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Không tìm thấy khóa học hoặc bạn không có quyền truy cập',
      );
    }

    // 1. LẤY THÊM MỤC TIÊU VÀ YÊU CẦU TỪ DATABASE
    const mucTieuData = await this.dataSource.query(
      `SELECT NoiDung FROM MucTieuKhoaHoc WHERE MaKH = ?`, [courseId]
    );
    const yeuCauData = await this.dataSource.query(
      `SELECT NoiDung FROM YeuCauKhoaHoc WHERE MaKH = ?`, [courseId]
    );

    // 2. GỘP VÀO OBJECT TRẢ VỀ
    return {
      ...course,
      muc_tieu: mucTieuData.map((item: any) => item.NoiDung),
      yeu_cau: yeuCauData.map((item: any) => item.NoiDung),
    };
  }

  async updateCourse(courseId: number, instructorId: number, payload: any, mucTieu: string[], yeuCau: string[]) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) throw new ForbiddenException('Bạn không có quyền sửa khóa học này');

    // 1. Cập nhật thông tin cơ bản
    Object.assign(course, payload);
    const updatedCourse = await this.khoaHocRepository.save(course);

    // 2. Xóa dữ liệu cũ và chèn dữ liệu mới cho Mục tiêu
    if (mucTieu !== undefined) {
      await this.dataSource.query(`DELETE FROM MucTieuKhoaHoc WHERE MaKH = ?`, [courseId]);
      for (const noiDung of mucTieu) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO MucTieuKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()]
          );
        }
      }
    }

    // 3. Xóa dữ liệu cũ và chèn dữ liệu mới cho Yêu cầu
    if (yeuCau !== undefined) {
      await this.dataSource.query(`DELETE FROM YeuCauKhoaHoc WHERE MaKH = ?`, [courseId]);
      for (const noiDung of yeuCau) {
        if (noiDung.trim()) {
          await this.dataSource.query(
            `INSERT INTO YeuCauKhoaHoc (MaKH, NoiDung) VALUES (?, ?)`,
            [courseId, noiDung.trim()]
          );
        }
      }
    }

    return updatedCourse;
  }
}
