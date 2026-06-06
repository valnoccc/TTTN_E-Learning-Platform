import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { KhoaHoc } from '../entities/course.entity';
import { CreateReplyDto } from '../dto/create-reply.dto';
import { CreateDiscussionReplyDto } from '../dto/create-discussion-reply.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

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
      await this.khoaHocRepository.update(courseId, { trangThai: 'DRAFT' });
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
  async replyToReview(
    courseId: number,
    instructorId: number,
    payload: CreateReplyDto,
  ) {
    // 1. Xác thực quyền giảng viên đối với khóa học
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
      relations: ['giangVien'], // Nạp thêm thông tin giảng viên để trả về cho FE
    });

    if (!course) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên khóa học này',
      );
    }

    // 2. Kiểm tra đánh giá gốc có tồn tại và thuộc khóa học này không
    const parentReview = await this.dataSource.query(
      `SELECT MaDanhGia FROM DanhGiaKhoaHoc WHERE MaDanhGia = ? AND MaKH = ?`,
      [payload.parentId, courseId],
    );

    if (parentReview.length === 0) {
      throw new BadRequestException('Không tìm thấy đánh giá gốc hợp lệ');
    }

    // 3. Chèn phản hồi vào database (Giảng viên phản hồi không tính SoSao nên mặc định là 0)
    const result = await this.dataSource.query(
      `INSERT INTO DanhGiaKhoaHoc (MaKH, MaND, SoSao, NoiDung, ThoiGian, MaDanhGiaCha) 
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [courseId, instructorId, 0, payload.noiDung, payload.parentId],
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
      studentAvatar: course.giangVien?.anhDaiDien || null,
    };
  }

  // Chức năng mới: Lấy thảo luận của khóa học cho giảng viên
  async getCourseDiscussions(courseId: number, instructorId: number) {
    // 1. Kiểm tra xem giảng viên có sở hữu khóa học này không
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Bạn không có quyền xem thảo luận của khóa học này',
      );
    }

    // 2. Truy vấn danh sách thảo luận kèm thông tin người gửi
    const discussions = await this.dataSource.query(
      `
      SELECT 
        tl.MaThaoLuan AS discussionId,
        tl.NoiDung AS content,
        tl.ThoiGian AS createdAt,
        tl.MaThaoLuanCha AS parentId,
        u.MaND AS userId,
        u.HoTen AS userName,
        u.AnhDaiDien AS userAvatar
      FROM ThaoLuanKhoaHoc tl
      INNER JOIN NguoiDung u ON tl.MaND = u.MaND
      WHERE tl.MaKH = ?
      ORDER BY tl.ThoiGian DESC
      `,
      [courseId],
    );

    return discussions;
  }

  async replyToDiscussion(
    courseId: number,
    instructorId: number,
    payload: CreateDiscussionReplyDto,
  ) {
    // 1. Kiểm tra xem giảng viên có sở hữu khóa học này không
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
      relations: ['giangVien'], // Kéo theo thông tin Profile giảng viên để map data trả về Frontend
    });

    if (!course) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên khóa học này',
      );
    }

    // 2. Kiểm tra cuộc thảo luận gốc (câu hỏi của học viên) có tồn tại thực tế không
    const parentDiscussion = await this.dataSource.query(
      `SELECT MaThaoLuan FROM ThaoLuanKhoaHoc WHERE MaThaoLuan = ? AND MaKH = ?`,
      [payload.parentId, courseId],
    );

    if (parentDiscussion.length === 0) {
      throw new BadRequestException('Không tìm thấy cuộc thảo luận gốc hợp lệ');
    }

    // 3. Thực hiện chèn câu trả lời của Giảng viên vào bảng dữ liệu ThaoLuanKhoaHoc
    const result = await this.dataSource.query(
      `INSERT INTO ThaoLuanKhoaHoc (MaKH, MaND, NoiDung, ThoiGian, MaThaoLuanCha) 
       VALUES (?, ?, ?, NOW(), ?)`,
      [courseId, instructorId, payload.noiDung, payload.parentId],
    );

    // 4. Trả về cấu trúc JSON tương đương với Interface Discussion ở Frontend nhằm cập nhật State tức thì
    return {
      discussionId: result.insertId,
      content: payload.noiDung,
      createdAt: new Date().toISOString(),
      parentId: payload.parentId,
      userId: instructorId,
      userName: course.giangVien?.hoTen || 'Giảng viên',
      userAvatar: course.giangVien?.anhDaiDien || null,
    };
  }

  async getCourseCurriculum(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Bạn không có quyền xem khóa học này');
    }

    const chapters = await this.dataSource.query(
      `SELECT MaChuong AS maChuong, MaKH AS maKH, TenChuong AS tenChuong, ThuTu AS thuTu
       FROM ChuongHoc WHERE MaKH = ? ORDER BY ThuTu ASC`,
      [courseId],
    );

    if (chapters.length === 0) return [];

    // TẠO DẤU CHẤM HỎI ĐỘNG CHO TRUY VẤN IN (...) ĐỂ CHỐNG LỖI TYPEORM
    const chapterIds = chapters.map((c: any) => c.maChuong);
    const placeholders = chapterIds.map(() => '?').join(',');

    const lessons = await this.dataSource.query(
      `SELECT MaBH AS maBH, MaChuong AS maChuong, TenBaiHoc AS tenBaiHoc, 
              VideoURL AS videoUrl, NoiDung AS noiDung, ThuTu AS thuTu, ThoiLuong AS thoiLuong
       FROM BaiHoc
       WHERE MaChuong IN (${placeholders}) AND TrangThai = 'ACTIVE'
       ORDER BY ThuTu ASC`,
      [...chapterIds], // Trải phẳng mảng ID ra
    );

    return chapters.map((chapter: any) => ({
      ...chapter,
      baiHocs: lessons.filter(
        (lesson: any) => lesson.maChuong === chapter.maChuong,
      ),
    }));
  }

  // ========================================================
  // THÊM CHƯƠNG MỚI
  // ========================================================
  async addChapter(
    courseId: number,
    instructorId: number,
    payload: { tenChuong: string; thuTu: number },
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course)
      throw new ForbiddenException(
        'Bạn không có quyền thêm chương cho khóa học này',
      );

    const result = await this.dataSource.query(
      `INSERT INTO ChuongHoc (MaKH, TenChuong, ThuTu) VALUES (?, ?, ?)`,
      [courseId, payload.tenChuong, payload.thuTu],
    );

    return {
      maChuong: result.insertId,
      maKH: courseId,
      tenChuong: payload.tenChuong,
      thuTu: payload.thuTu,
      baiHocs: [],
    };
  }

  // ========================================================
  // THÊM BÀI HỌC MỚI VÀO CHƯƠNG
  // ========================================================
  async addLesson(
    chapterId: number,
    payload: { maKH: number; tenBaiHoc: string; thuTu: number },
  ) {
    const result = await this.dataSource.query(
      `INSERT INTO BaiHoc (MaKH, MaChuong, TenBaiHoc, ThuTu, TrangThai) VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [payload.maKH, chapterId, payload.tenBaiHoc, payload.thuTu],
    );

    return {
      maBH: result.insertId,
      maKH: payload.maKH,
      maChuong: chapterId,
      tenBaiHoc: payload.tenBaiHoc,
      thuTu: payload.thuTu,
      videoUrl: null,
      noiDung: null,
      thoiLuong: 0,
    };
  }
}
