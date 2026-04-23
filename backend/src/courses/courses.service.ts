import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KhoaHoc } from './entities/course.entity';


@Injectable()
export class CoursesService {
  courseRepo: any;
  dataSource: any;
  constructor(
    @InjectRepository(KhoaHoc)
    private khoaHocRepository: Repository<KhoaHoc>,
  ) { }

  // Hàm lấy danh sách khóa học theo ID Giảng viên
  async getCoursesByInstructor(instructorId: number) {
    try {
      // Tìm tất cả khóa học có id_giang_vien khớp với ID từ Token
      const courses = await this.khoaHocRepository.find({
        where: {
          id_giang_vien: instructorId
        },
        order: {
          ngay_tao: 'DESC' // Sắp xếp khóa học mới nhất lên đầu
        }
      });

      return courses;
    } catch (error) {
      console.error('Lỗi truy vấn CSDL:', error);
      throw new Error('Không thể lấy dữ liệu từ CSDL');
    }
  }

  async createCourse(payload: any) {
    console.log('Service đang nhận data để lưu vào DB:', payload);

    // 👇 NƠI BẠN VIẾT CODE LƯU DATABASE 👇
    // Ví dụ nếu bạn dùng TypeORM:
    // const newCourse = this.khoaHocRepository.create(payload);
    // return await this.khoaHocRepository.save(newCourse);

    // Ví dụ SQL thuần: 
    // const query = `INSERT INTO khoahoc (ten_khoa_hoc, mo_ta, gia, id_danh_muc, id_giang_vien) VALUES (...)`;

    // Tạm thời trả về object mock để bạn test API thành công đã:

    try {
      // payload lúc này đã chứa: ten_khoa_hoc, mo_ta, gia, id_danh_muc, id_giang_vien

      // 1. Tạo bản ghi mới
      const newCourse = this.khoaHocRepository.create(payload);

      // 2. Lưu xuống MySQL
      const savedCourse = await this.khoaHocRepository.save(newCourse);

      return savedCourse;
    } catch (error) {
      console.error('Lỗi khi INSERT vào bảng khoahoc:', error);
      throw new Error('Không thể lưu khóa học vào CSDL');
    }
  }

  async remove(courseId: number, instructorId: number) {
    // 1. Kiểm tra khóa học có phải của giảng viên này không
    const course = await this.courseRepo.findOne({
      where: { id: courseId, id_giang_vien: instructorId }
    });
    if (!course) throw new ForbiddenException('Bạn không có quyền xóa khóa học này');

    // 2. Kiểm tra xem đã có ai mua chưa (Dựa trên bảng chitiethoadon trong db_tttn.sql)
    const hasBuyers = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM chitiethoadon WHERE id_khoa_hoc = ?`,
      [courseId]
    );

    if (hasBuyers[0].count > 0) {
      // 3. Nếu có người mua -> Chuyển trạng thái sang HIDDEN (ẨN) thay vì xóa
      await this.courseRepo.update(courseId, { trang_thai: 'HIDDEN' });
      return { message: 'Khóa học đã có học viên mua, hệ thống đã chuyển sang trạng thái ẨN.' };
    }

    // 4. Nếu chưa ai mua -> Xóa vĩnh viễn
    await this.courseRepo.delete(courseId);
    return { message: 'Đã xóa khóa học thành công.' };
  }
  // ========================================================
  // HÀM MỚI 2: CẬP NHẬT KHÓA HỌC
  // ========================================================
  async updateCourse(courseId: number, instructorId: number, payload: any) {
    console.log(`Service đang sửa khóa ${courseId} của GV ${instructorId} với data:`, payload);

    // 👇 NƠI BẠN VIẾT CODE SỬA DATABASE 👇
    // Nguyên tắc bảo mật quan trọng:
    // 1. Tìm khóa học xem có tồn tại không.
    // 2. KỂM TRA XEM khóa học đó có đúng là do instructorId tạo ra không (tránh GV này sửa bài GV khác).
    // 3. Thực thi Update.

    // Tạm thời trả về object mock:
    return {
      id: courseId,
      ...payload,
      trang_thai_cap_nhat: 'Thành công'
    };
  }
}