import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../entities/course.entity';
import { LessonVideoStorageService } from '../../lesson-video-storage/lesson-video-storage.service';

export interface PublicCourseFilters {
  search?: string;
  categoryId?: string;
  price?: string;
}

type PublishedCourseRow = {
  averageRating?: string | number | null;
  totalLessons?: string | number | null;
  totalDurationSeconds?: string | number | null;
};

@Injectable()
export class CourseStudentService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
    private readonly lessonVideoStorageService: LessonVideoStorageService,
  ) {}

  async getAllPublishedCourses(filters: PublicCourseFilters = {}) {
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
            .addSelect('COALESCE(SUM(bh.ThoiLuong), 0)', 'totalDurationSeconds')
            .where(`bh.TrangThai = 'ACTIVE'`)
            .groupBy('ch.MaKH'),
        'lessonStats',
        'lessonStats.maKH = khoaHoc.maKH',
      )
      .addSelect('ratings.avgRating', 'averageRating')
      .addSelect('lessonStats.lessonCount', 'totalLessons')
      .addSelect('lessonStats.totalDurationSeconds', 'totalDurationSeconds')
      .where('khoaHoc.trangThai = :status', { status: 'PUBLISHED' });

    if (filters.search?.trim()) {
      const normalizedSearch = `%${filters.search.trim().toLowerCase()}%`;
      query.andWhere(
        `(
          LOWER(khoaHoc.tenKhoaHoc) LIKE :search
          OR LOWER(khoaHoc.moTa)    LIKE :search
          OR LOWER(giangVien.hoTen) LIKE :search
        )`,
        { search: normalizedSearch },
      );
    }

    if (filters.categoryId) {
      query.andWhere('khoaHoc.maDM = :categoryId', {
        categoryId: Number.parseInt(filters.categoryId, 10),
      });
    }

    if (filters.price === 'free') {
      query.andWhere('khoaHoc.giaBan = 0');
    }

    query.orderBy('khoaHoc.maKH', 'DESC');

    const { entities, raw } = await query.getRawAndEntities();
    return entities.map((course, index) => {
      const stats = raw[index] as PublishedCourseRow | undefined;
      return {
        ...course,
        averageRating: stats?.averageRating
          ? Number(stats.averageRating).toFixed(1)
          : '0.0',
        totalLessons: stats?.totalLessons ? Number(stats.totalLessons) : 0,
        totalDurationSeconds: stats?.totalDurationSeconds
          ? Number(stats.totalDurationSeconds)
          : 0,
      };
    });
  }

  async getPublishedCourseById(courseId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, trangThai: 'PUBLISHED' },
      relations: ['giangVien', 'danhMuc', 'baiHocs'],
    });

    if (!course) {
      throw new NotFoundException(
        'Khóa học không tồn tại hoặc chưa được kích hoạt',
      );
    }

    const [mucTieuRows, yeuCauRows, instructorRows, instructorStatsRows] =
      await Promise.all([
        this.dataSource.query(
          `SELECT NoiDung FROM MucTieuKhoaHoc WHERE MaKH = ?`,
          [courseId],
        ),
        this.dataSource.query(
          `SELECT NoiDung FROM YeuCauKhoaHoc WHERE MaKH = ?`,
          [courseId],
        ),
        course.giangVien
          ? this.dataSource.query(
              `SELECT ChuyenMon, TieuSu FROM HoSoGiangVien WHERE MaND = ?`,
              [course.giangVien.maND],
            )
          : Promise.resolve([]),
        course.giangVien
          ? this.dataSource.query(
              `SELECT
                 (SELECT COUNT(*) FROM KhoaHoc WHERE MaND_GiangVien = ? AND TrangThai IN ('PUBLISHED', 'PENDING')) AS totalCourses,
                 (SELECT COUNT(DISTINCT dk.MaND)
                  FROM DangKyKhoaHoc dk
                  JOIN KhoaHoc kh ON dk.MaKH = kh.MaKH
                  WHERE kh.MaND_GiangVien = ? AND dk.TrangThai = 'ACTIVE') AS totalStudents,
                 (SELECT COUNT(DISTINCT dk2.MaND)
                  FROM DangKyKhoaHoc dk2
                  WHERE dk2.MaKH = ? AND dk2.TrangThai = 'ACTIVE') AS courseTotalStudents`,
              [course.giangVien.maND, course.giangVien.maND, course.maKH],
            )
          : Promise.resolve([]),
      ]);

    const hoSo = instructorRows.length > 0 ? instructorRows[0] : {};
    const stats = instructorStatsRows[0] ?? {};
    const instructorData = course.giangVien
      ? {
          ...course.giangVien,
          tenGiangVien: course.giangVien.hoTen,
          avatar: course.giangVien.anhDaiDien,
          chuyenMon: hoSo.ChuyenMon || null,
          tieuSu: hoSo.TieuSu || null,
          totalCourses: Number(stats.totalCourses ?? 0),
          totalStudents: Number(stats.totalStudents ?? 0),
        }
      : null;

    return {
      ...course,
      giangVien: instructorData,
      totalStudents: Number(stats.courseTotalStudents ?? 0),
      muc_tieu: mucTieuRows.map((item: any) => item.NoiDung).filter(Boolean),
      yeu_cau: yeuCauRows.map((item: any) => item.NoiDung).filter(Boolean),
      baiHocs: Array.isArray(course.baiHocs)
        ? await Promise.all(
            course.baiHocs.map(async (lesson: any) => ({
              ...lesson,
              videoURL: await this.lessonVideoStorageService.getPlayableUrl(
                lesson.videoURL ?? null,
              ),
            })),
          )
        : [],
    };
  }

  async getCourseRecommendations(courseId: number, userId?: string) {
    let excludeCondition = `k.MaKH != ?`;
    const params: any[] = [courseId];

    if (userId) {
      const parsedUserId = Number.parseInt(userId, 10);
      if (!Number.isNaN(parsedUserId)) {
        excludeCondition += ` AND k.MaKH NOT IN (SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND TrangThai = 'ACTIVE')`;
        params.push(parsedUserId);
      }
    }

    const courseInfo = await this.dataSource.query(
      `SELECT MaDM FROM KhoaHoc WHERE MaKH = ? LIMIT 1`,
      [courseId],
    );
    const maDM = courseInfo[0]?.MaDM || 0;

    const recommendations = await this.dataSource.query(
      `SELECT k.MaKH as maKH, k.TenKhoaHoc as tenKhoaHoc, k.MoTa as moTa, 
              k.GiaBan as giaBan, k.HinhThuNho as hinhAnh,
              (SELECT AVG(SoSao) FROM DanhGiaKhoaHoc WHERE MaKH = k.MaKH) as averageRating
       FROM KhoaHoc k
       WHERE ${excludeCondition} AND k.TrangThai = 'PUBLISHED' 
       ORDER BY (k.MaDM = ?) DESC, RAND() LIMIT 4`,
      [...params, maDM],
    );

    const vouchers = await this.dataSource.query(
      `SELECT MaCode as code, GiaTriGiam as discount, LoaiGiam as discountType
       FROM MaGiamGia 
       WHERE LoaiKM = 'CROSS_SELL' AND TrangThai = 'ACTIVE' AND (NgayKetThuc IS NULL OR NgayKetThuc > NOW())
       LIMIT 1`,
    );

    const crossSellVoucher =
      vouchers.length > 0
        ? {
            code: vouchers[0].code,
            discount: Number(vouchers[0].discount),
            discountType: vouchers[0].discountType,
          }
        : null;

    return {
      recommendations: recommendations.map((r: any) => ({
        ...r,
        giaBan: Number(r.giaBan),
        averageRating: r.averageRating
          ? Number(r.averageRating).toFixed(1)
          : '0.0',
      })),
      crossSellVoucher,
    };
  }

  async getCourseCurriculum(courseId: number) {
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
      return [];
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

    const lessonsByChapter = await Promise.all(
      chapters.map(async (chapter: any) => {
        const baiHocs = await Promise.all(
          lessons
            .filter((lesson: any) => lesson.maChuong === chapter.maChuong)
            .map(async (lesson: any) => ({
              ...lesson,
              videoUrl: await this.lessonVideoStorageService.getPlayableUrl(
                lesson.videoUrl,
              ),
            })),
        );

        return {
          ...chapter,
          baiHocs,
        };
      }),
    );

    return lessonsByChapter;
  }
}
