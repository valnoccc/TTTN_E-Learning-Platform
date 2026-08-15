import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../entities/course.entity';
import { LessonVideoStorageService } from '../../lesson-video-storage/lesson-video-storage.service';

export interface PublicCourseFilters {
  search?: string;
  categoryId?: string;
  price?: string;
  rating?: string;
  sort?: string;
}

type PublishedCourseRow = {
  averageRating?: string | number | null;
  totalLessons?: string | number | null;
  totalQuestions?: string | number | null;
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
      .leftJoin(
        (qb) =>
          qb
            .from('CauHoiTracNghiem', 'cauHoi')
            .innerJoin(
              'ChuongHoc',
              'chuongHoc',
              'cauHoi.MaChuong = chuongHoc.MaChuong',
            )
            .select('chuongHoc.MaKH', 'maKH')
            .addSelect('COUNT(*)', 'questionCount')
            .groupBy('chuongHoc.MaKH'),
        'questionStats',
        'questionStats.maKH = khoaHoc.maKH',
      )
      .addSelect('ratings.avgRating', 'averageRating')
      .addSelect('lessonStats.lessonCount', 'totalLessons')
      .addSelect('questionStats.questionCount', 'totalQuestions')
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

    if (filters.rating) {
      const minRating = Number.parseFloat(filters.rating);
      if (!Number.isNaN(minRating)) {
        query.having('ratings.avgRating >= :minRating', { minRating });
      }
    }

    if (filters.sort) {
      switch (filters.sort) {
        case 'oldest':
          query.orderBy('khoaHoc.maKH', 'ASC');
          break;
        case 'name_asc':
          query.orderBy('khoaHoc.tenKhoaHoc', 'ASC');
          break;
        case 'name_desc':
          query.orderBy('khoaHoc.tenKhoaHoc', 'DESC');
          break;
        case 'price_asc':
          query.orderBy('khoaHoc.giaBan', 'ASC');
          break;
        case 'price_desc':
          query.orderBy('khoaHoc.giaBan', 'DESC');
          break;
        default:
          query.orderBy('khoaHoc.maKH', 'DESC');
      }
    } else {
      query.orderBy('khoaHoc.maKH', 'DESC');
    }

    const { entities, raw } = await query.getRawAndEntities();
    return entities.map((course, index) => {
      const stats = raw[index] as PublishedCourseRow | undefined;
      return {
        ...course,
        averageRating: stats?.averageRating
          ? Number(stats.averageRating).toFixed(1)
          : '0.0',
        totalLessons: stats?.totalLessons ? Number(stats.totalLessons) : 0,
        totalQuestions: stats?.totalQuestions
          ? Number(stats.totalQuestions)
          : 0,
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

  async getCourseRecommendations(courseIdParam: number | number[], userId?: string) {
    // ─── Chuẩn hoá đầu vào ───────────────────────────────────────────────────
    const courseIds = Array.isArray(courseIdParam) ? courseIdParam : [courseIdParam];
    if (courseIds.length === 0) {
      return { recommendations: [], crossSellVoucher: null };
    }

    const TOTAL_LIMIT = 4; // Tổng số gợi ý muốn trả về (khớp với UI 4 card)

    // ─── Build điều kiện loại trừ (khóa học trong giỏ + đã đăng ký) ─────────
    const excludePlaceholders = courseIds.map(() => '?').join(',');
    const excludeParams: any[] = [...courseIds];

    let enrolledExclude = '';
    if (userId) {
      const parsedUserId = Number.parseInt(userId, 10);
      if (!Number.isNaN(parsedUserId)) {
        enrolledExclude = ` AND k.MaKH NOT IN (
          SELECT MaKH FROM DangKyKhoaHoc WHERE MaND = ? AND TrangThai = 'ACTIVE'
        )`;
        excludeParams.push(parsedUserId);
      }
    }

    // ─── BƯỚC 1: Lấy danh mục duy nhất từ khóa học vừa mua ──────────────────
    const categoryInfo: { MaDM: number }[] = await this.dataSource.query(
      `SELECT DISTINCT MaDM FROM KhoaHoc WHERE MaKH IN (${excludePlaceholders})`,
      courseIds,
    );
    const distinctMaDMs: number[] = categoryInfo
      .map((r) => Number(r.MaDM))
      .filter((id) => id > 0);

    // ─── BƯỚC 1b: Lấy ứng viên theo từng danh mục trong 1 truy vấn duy nhất ─
    // Mỗi danh mục lấy tối đa `TOTAL_LIMIT` ứng viên để có đủ xoay vòng.
    // Dùng biến @rank để mô phỏng ROW_NUMBER tương thích MySQL 5.x/8.x.
    let categoryRecommendations: any[] = [];

    if (distinctMaDMs.length > 0) {
      const catPlaceholders = distinctMaDMs.map(() => '?').join(',');
      // Lấy top N khóa học của TẤT CẢ danh mục liên quan, gom vào 1 query
      const candidateRows: any[] = await this.dataSource.query(
        `SELECT k.MaKH as maKH, k.TenKhoaHoc as tenKhoaHoc, k.MoTa as moTa,
                k.GiaBan as giaBan, k.HinhThuNho as hinhAnh, k.MaDM as maDM,
                (SELECT AVG(SoSao) FROM DanhGiaKhoaHoc dg WHERE dg.MaKH = k.MaKH) as averageRating,
                (SELECT COUNT(MaND) FROM DangKyKhoaHoc dk WHERE dk.MaKH = k.MaKH AND dk.TrangThai = 'ACTIVE') as soNguoiHoc
         FROM KhoaHoc k
         WHERE k.MaKH NOT IN (${excludePlaceholders})${enrolledExclude}
           AND k.TrangThai = 'PUBLISHED'
           AND k.MaDM IN (${catPlaceholders})
         ORDER BY k.MaDM ASC, soNguoiHoc DESC`,
        [...excludeParams, ...distinctMaDMs],
      );

      // Group theo danh mục (không tốn thêm query)
      const buckets = new Map<number, any[]>();
      for (const row of candidateRows) {
        const maDM = Number(row.maDM);
        if (!buckets.has(maDM)) buckets.set(maDM, []);
        buckets.get(maDM)!.push(row);
      }

      // BƯỚC 3: Thuật toán phân bổ rút bài vòng tròn (Round-Robin)
      const activeBuckets = distinctMaDMs.map((id) => buckets.get(id) ?? []);
      let currentIndex = 0;

      while (categoryRecommendations.length < TOTAL_LIMIT && activeBuckets.length > 0) {
        const currentPool = activeBuckets[currentIndex];

        if (currentPool && currentPool.length > 0) {
          // Lấy khóa học đầu tiên ra khỏi Pool (xóa khỏi mảng pool ban đầu)
          const course = currentPool.shift();
          
          if (course) {
            categoryRecommendations.push(course);
          }
          
          // Chuyển sang danh mục tiếp theo
          currentIndex = (currentIndex + 1) % activeBuckets.length;
        } else {
          // Bỏ qua (Skip): Nếu Pool đã cạn, loại bỏ danh mục này khỏi vòng lặp Round-Robin
          activeBuckets.splice(currentIndex, 1);
          
          if (activeBuckets.length > 0) {
            currentIndex = currentIndex % activeBuckets.length;
          }
        }
      }
    }

    console.log(
      `[Recommendations] courseIds=${JSON.stringify(courseIds)} | distinctMaDMs=${JSON.stringify(distinctMaDMs)} | categoryResults=${categoryRecommendations.length}`,
    );

    // ─── BƯỚC 2: Fallback – lấp đầy khoảng còn thiếu bằng Khóa học Nổi bật ──
    // Ưu tiên cùng danh mục (Bước 1). Nếu chưa đủ TOTAL_LIMIT (do DB ít khoá),
    // tự động bổ sung thêm popular courses cho đủ slot hiển thị.
    const remaining = TOTAL_LIMIT - categoryRecommendations.length;
    let finalRecommendations = [...categoryRecommendations];

    if (remaining > 0) {
      const alreadyPickedIds = [
        ...courseIds,
        ...categoryRecommendations.map((r) => r.maKH),
      ];
      const fallbackExcludePlaceholders = alreadyPickedIds.map(() => '?').join(',');
      const fallbackEnrolledExclude = enrolledExclude; // Cùng điều kiện đã đăng ký

      // Bỏ userId params đã push trước đó, build lại cho fallback
      const fallbackParams: any[] = [...alreadyPickedIds];
      if (userId) {
        const parsedUserId = Number.parseInt(userId, 10);
        if (!Number.isNaN(parsedUserId)) fallbackParams.push(parsedUserId);
      }

      const fallbackRows: any[] = await this.dataSource.query(
        `SELECT k.MaKH as maKH, k.TenKhoaHoc as tenKhoaHoc, k.MoTa as moTa,
                k.GiaBan as giaBan, k.HinhThuNho as hinhAnh, k.MaDM as maDM,
                (SELECT AVG(SoSao) FROM DanhGiaKhoaHoc dg WHERE dg.MaKH = k.MaKH) as averageRating,
                (SELECT COUNT(MaND) FROM DangKyKhoaHoc dk WHERE dk.MaKH = k.MaKH AND dk.TrangThai = 'ACTIVE') as soNguoiHoc
         FROM KhoaHoc k
         WHERE k.MaKH NOT IN (${fallbackExcludePlaceholders})${fallbackEnrolledExclude}
           AND k.TrangThai = 'PUBLISHED'
         ORDER BY soNguoiHoc DESC
         LIMIT ?`,
        [...fallbackParams, remaining],
      );

      finalRecommendations = [...finalRecommendations, ...fallbackRows];
    }

    // ─── Cross-sell voucher ───────────────────────────────────────────────────
    const vouchers: any[] = await this.dataSource.query(
      `SELECT MaCode as code, GiaTriGiam as discount, LoaiGiam as discountType
       FROM MaGiamGia
       WHERE LoaiKM = 'CROSS_SELL' AND TrangThai = 'ACTIVE'
         AND (NgayKetThuc IS NULL OR NgayKetThuc > NOW())
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
      recommendations: finalRecommendations.map((r: any) => ({
        maKH: Number(r.maKH),
        tenKhoaHoc: r.tenKhoaHoc,
        moTa: r.moTa,
        giaBan: Number(r.giaBan),
        hinhAnh: r.hinhAnh,
        maDM: Number(r.maDM),
        averageRating: r.averageRating ? Number(r.averageRating).toFixed(1) : '0.0',
        soNguoiHoc: Number(r.soNguoiHoc ?? 0),
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
