import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../entities/course.entity';

@Controller('public/courses')
export class PublicCoursesController {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
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
      .leftJoinAndSelect('khoaHoc.danhMuc', 'danhMuc')
      .leftJoin(
        (qb) =>
          qb
            .from('DanhGiaKhoaHoc', 'dg')
            .select('dg.MaKH', 'maKH')
            .addSelect('AVG(dg.SoSao)', 'avgRating')
            .where('dg.SoSao > 0')
            .groupBy('dg.MaKH'),
        'ratings',
        'ratings.maKH = khoaHoc.maKH',
      )
      .leftJoin(
        (qb) =>
          qb
            .from('BaiHoc', 'bh')
            .innerJoin('ChuongHoc', 'ch', 'bh.MaChuong = ch.MaChuong')
            .select('ch.MaKH', 'maKH')
            .addSelect('COUNT(*)', 'lessonCount')
            .where(`bh.TrangThai = 'ACTIVE'`)
            .groupBy('ch.MaKH'),
        'lessonStats',
        'lessonStats.maKH = khoaHoc.maKH',
      )
      .addSelect('ratings.avgRating', 'averageRating')
      .addSelect('lessonStats.lessonCount', 'totalLessons')
      .where('khoaHoc.trangThai = :status', { status: 'PUBLISHED' });

    if (search) {
      const normalizedSearch = `%${search.trim().toLowerCase()}%`;
      query.andWhere(
        `(
          LOWER(khoaHoc.tenKhoaHoc) LIKE :search
          OR LOWER(khoaHoc.moTa)    LIKE :search
          OR LOWER(giangVien.hoTen) LIKE :search
        )`,
        { search: normalizedSearch },
      );
    }

    if (categoryId) {
      query.andWhere('khoaHoc.maDM = :categoryId', {
        categoryId: parseInt(categoryId, 10),
      });
    }

    if (price === 'free') {
      query.andWhere('khoaHoc.giaBan = 0');
    }

    query.orderBy('khoaHoc.maKH', 'DESC');

    const { entities, raw } = await query.getRawAndEntities();
    const courses = entities.map((course, index) => ({
      ...course,
      averageRating: raw[index]?.averageRating
        ? Number(raw[index].averageRating).toFixed(1)
        : '0.0',
      totalLessons: raw[index]?.totalLessons
        ? Number(raw[index].totalLessons)
        : 0,
    }));

    return {
      message: 'Lấy danh sách khóa học thành công',
      data: courses,
    };
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string) {
    // ── PHÒNG VỆ NaN: chặn trước khi TypeORM truyền NaN vào SQL WHERE ──
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      throw new BadRequestException(
        `Mã khóa học (courseId) không hợp lệ hoặc bị rỗng (NaN): "${id}"`,
      );
    }

    const course = await this.khoaHocRepository.findOne({
      where: { maKH: parsedId },
      relations: ['giangVien', 'danhMuc', 'baiHocs'],
    });

    if (!course || course.trangThai !== 'PUBLISHED') {
      throw new NotFoundException(
        'Khóa học không tồn tại hoặc chưa được kích hoạt',
      );
    }

    let instructorData: any = null;

    if (course.giangVien) {
      const maND = course.giangVien.maND;

      const [hoSoList, statsRows] = await Promise.all([
        this.dataSource.query(
          `SELECT ChuyenMon, TieuSu FROM HoSoGiangVien WHERE MaND = ?`,
          [maND],
        ),
        this.dataSource.query(
          `SELECT
             (SELECT COUNT(*) FROM KhoaHoc WHERE MaND_GiangVien = ? AND TrangThai IN ('PUBLISHED', 'PENDING')) AS totalCourses,
             (SELECT COUNT(DISTINCT dk.MaND)
              FROM DangKyKhoaHoc dk
              JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
              WHERE kh.MaND_GiangVien = ? AND dk.TrangThai = 'ACTIVE') AS totalStudents,
             (SELECT COUNT(DISTINCT dk2.MaND)
              FROM DangKyKhoaHoc dk2
              WHERE dk2.MaKH = ? AND dk2.TrangThai = 'ACTIVE') AS courseTotalStudents`,
          [maND, maND, course.maKH],
        ),
      ]);
      const hoSo = hoSoList.length > 0 ? hoSoList[0] : {};
      const stats = statsRows[0] ?? {};

      instructorData = {
        ...course.giangVien,
        tenGiangVien: course.giangVien.hoTen,
        avatar: course.giangVien.anhDaiDien,
        chuyenMon: hoSo.ChuyenMon || null,
        tieuSu: hoSo.TieuSu || null,
        totalCourses: Number(stats.totalCourses ?? 0),
        totalStudents: Number(stats.totalStudents ?? 0),
      };

      const responseData = {
        ...course,
        giangVien: instructorData,
        totalStudents: Number(stats.courseTotalStudents ?? 0),
      };

      return {
        message: 'Lấy chi tiết khóa học thành công',
        data: responseData,
      };
    }

    return {
      message: 'Lấy chi tiết khóa học thành công',
      data: {
        ...course,
        giangVien: course.giangVien,
        totalStudents: 0,
      },
    };
  }

  @Get(':id/curriculum')
  async getCourseCurriculum(@Param('id') id: string) {
    // ── PHÒNG VỆ NaN: chặn trước khi query ChuongHoc với NaN ──
    const courseId = parseInt(id, 10);
    if (isNaN(courseId)) {
      throw new BadRequestException(
        `Mã khóa học (courseId) không hợp lệ hoặc bị rỗng (NaN): "${id}"`,
      );
    }

    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId },
      select: ['maKH', 'trangThai'],
    });

    if (!course || course.trangThai !== 'PUBLISHED') {
      throw new NotFoundException(
        'Khóa học không tồn tại hoặc chưa được kích hoạt',
      );
    }

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
