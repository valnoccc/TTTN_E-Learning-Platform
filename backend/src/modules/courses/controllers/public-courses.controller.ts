import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { KhoaHoc } from '../entities/course.entity';
import { CoursesService } from '../services/course-instructor.service';

@Controller('public/courses')
export class PublicCoursesController {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
    private readonly coursesService: CoursesService,
  ) {}

  @Get()
  async getAllCourses(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('price') price?: string,
  ) {
    const query = this.khoaHocRepository
      .createQueryBuilder('khoaHoc')
      .leftJoinAndSelect('khoaHoc.giangVien', 'giangVien')
      .leftJoinAndSelect('khoaHoc.danhMuc', 'danhMuc');

    if (search) {
      query.andWhere('khoaHoc.tenKhoaHoc LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (categoryId) {
      query.andWhere('khoaHoc.maDM = :categoryId', {
        categoryId: parseInt(categoryId),
      });
    }

    if (price === 'free') {
      query.andWhere('khoaHoc.giaBan = 0');
    }

    query.orderBy('khoaHoc.maKH', 'DESC');

    const courses = await query.getMany();
    return {
      message: 'Lấy danh sách khóa học thành công',
      data: courses,
    };
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: parseInt(id) },
      relations: ['giangVien', 'danhMuc', 'baiHocs'],
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    let instructorData: any = null;

    if (course.giangVien) {
      const maND = course.giangVien.maND;

      // Lấy thông tin hồ sơ giảng viên (ChuyenMon, TieuSu)
      const hoSoList = await this.dataSource.query(
        `SELECT ChuyenMon, TieuSu FROM HoSoGiangVien WHERE MaND = ?`,
        [maND],
      );
      const hoSo = hoSoList.length > 0 ? hoSoList[0] : {};

      const stats = await this.coursesService.getInstructorStats(maND);

      instructorData = {
        ...course.giangVien,
        tenGiangVien: course.giangVien.hoTen,
        avatar: course.giangVien.anhDaiDien,
        chuyenMon: hoSo.ChuyenMon || null,
        tieuSu: hoSo.TieuSu || null,
        totalCourses: stats.totalCourses,
        totalStudents: stats.totalStudents,
      };
    }

    // Tính tổng số học viên đăng ký khóa học NÀY thông qua CoursesService
    const courseTotalStudents = await this.coursesService.getCourseTotalStudents(course.maKH);

    const responseData = {
      ...course,
      giangVien: instructorData || course.giangVien,
      totalStudents: courseTotalStudents,
    };

    return {
      message: 'Lấy chi tiết khóa học thành công',
      data: responseData,
    };
  }

  @Get(':id/curriculum')
  async getCourseCurriculum(@Param('id') id: string) {
    const courseId = parseInt(id);
    const chapters = await this.dataSource.query(
      `SELECT MaChuong AS maChuong, MaKH AS maKH, TenChuong AS tenChuong, ThuTu AS thuTu
       FROM ChuongHoc WHERE MaKH = ? ORDER BY ThuTu ASC`,
      [courseId],
    );

    if (chapters.length === 0) {
      return {
        message: 'Lấy chương trình học thành công',
        data: [],
      };
    }

    const chapterIds = chapters.map((chapter: any) => chapter.maChuong);
    const placeholders = chapterIds.map(() => '?').join(',');

    const lessons = await this.dataSource.query(
      `SELECT MaBH AS maBH, MaChuong AS maChuong, TenBaiHoc AS tenBaiHoc, 
              VideoURL AS videoUrl, NoiDung AS noiDung, ThuTu AS thuTu, ThoiLuong AS thoiLuong, choPhepXemTruoc
       FROM BaiHoc
       WHERE MaChuong IN (${placeholders}) AND TrangThai = 'ACTIVE'
       ORDER BY ThuTu ASC`,
      [...chapterIds],
    );

    const data = chapters.map((chapter: any) => ({
      ...chapter,
      baiHocs: lessons.filter(
        (lesson: any) => lesson.maChuong === chapter.maChuong,
      ),
    }));

    return {
      message: 'Lấy chương trình học thành công',
      data,
    };
  }
}
