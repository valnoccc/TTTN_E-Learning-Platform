import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { KhoaHoc } from '../entities/course.entity';
import { CreateReplyDto } from '../dto/create-reply.dto';

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

  async createCourse(payload: any) {
    const newCourse = this.khoaHocRepository.create(payload);
    return await this.khoaHocRepository.save(newCourse);
  }

  async remove(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course)
      throw new ForbiddenException('Bạn không có quyền xóa khóa học này');

    const hasBuyers = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ChiTietHoaDon WHERE MaKH = ?`,
      [courseId],
    );

    if (hasBuyers[0].count > 0) {
      await this.khoaHocRepository.update(courseId, { trangThai: 'HIDDEN' });
      return {
        message:
          'Khóa học đã có học viên mua, hệ thống đã chuyển sang trạng thái ẨN.',
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

    if (!course)
      throw new ForbiddenException('Bạn không có quyền sửa khóa học này');

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
    return course;
  }

  async updateCourse(courseId: number, instructorId: number, payload: any) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course)
      throw new ForbiddenException('Bạn không có quyền sửa khóa học này');

    Object.assign(course, payload);

    return await this.khoaHocRepository.save(course);
  }

  async getCourseReviews(courseId: number, instructorId: number) {
    // 1. Kiểm tra quyền sở hữu khóa học
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Bạn không có quyền xem đánh giá của khóa học này',
      );
    }

    // 2. Truy vấn danh sách đánh giá kèm thông tin học viên
    const reviews = await this.dataSource.query(
      `
      SELECT 
        dg.MaDanhGia AS reviewId,
        dg.SoSao AS rating,
        dg.NoiDung AS content,
        dg.ThoiGian AS createdAt,
        dg.MaDanhGiaCha AS parentId,
        u.MaND AS studentId,
        u.HoTen AS studentName,
        u.AnhDaiDien AS studentAvatar
      FROM DanhGiaKhoaHoc dg
      INNER JOIN NguoiDung u ON dg.MaND = u.MaND
      WHERE dg.MaKH = ?
      ORDER BY dg.ThoiGian DESC
      `,
      [courseId],
    );

    return reviews;
  }

  // Thêm vào class CoursesService
  async replyToReview(courseId: number, instructorId: number, payload: CreateReplyDto) {
    // 1. Xác thực quyền giảng viên đối với khóa học
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
      relations: ['giangVien'] // Nạp thêm thông tin giảng viên để trả về cho FE
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên khóa học này');
    }

    // 2. Kiểm tra đánh giá gốc có tồn tại và thuộc khóa học này không
    const parentReview = await this.dataSource.query(
      `SELECT MaDanhGia FROM DanhGiaKhoaHoc WHERE MaDanhGia = ? AND MaKH = ?`,
      [payload.parentId, courseId]
    );

    if (parentReview.length === 0) {
      throw new BadRequestException('Không tìm thấy đánh giá gốc hợp lệ');
    }

    // 3. Chèn phản hồi vào database (Giảng viên phản hồi không tính SoSao nên mặc định là 0)
    const result = await this.dataSource.query(
      `INSERT INTO DanhGiaKhoaHoc (MaKH, MaND, SoSao, NoiDung, ThoiGian, MaDanhGiaCha) 
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [courseId, instructorId, 0, payload.noiDung, payload.parentId]
    );

    // 4. Trả về cấu trúc giống Review interface trên Frontend để UI cập nhật ngay lập tức
    return {
      reviewId: result.insertId,
      rating: 0,
      content: payload.noiDung,
      createdAt: new Date().toISOString(),
      parentId: payload.parentId,
      studentId: instructorId,
      studentName: course.giangVien?.hoTen || 'Giảng viên',
      studentAvatar: course.giangVien?.anhDaiDien || null
    };
  }
}

