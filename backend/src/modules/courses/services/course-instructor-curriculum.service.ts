import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../entities/course.entity';

@Injectable()
export class CourseInstructorCurriculumService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

  async getCourseCurriculum(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n xem khÃ³a há»c nÃ y');
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
              VideoURL AS videoUrl, NoiDung AS noiDung, ThuTu AS thuTu, ThoiLuong AS thoiLuong
       FROM BaiHoc
       WHERE MaChuong IN (${placeholders}) AND TrangThai = 'ACTIVE'
       ORDER BY ThuTu ASC`,
      [...chapterIds],
    );

    return chapters.map((chapter: any) => ({
      ...chapter,
      baiHocs: lessons.filter(
        (lesson: any) => lesson.maChuong === chapter.maChuong,
      ),
    }));
  }

  async addChapter(
    courseId: number,
    instructorId: number,
    payload: { tenChuong: string; thuTu: number },
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Báº¡n khÃ´ng cÃ³ quyá»n thÃªm chÆ°Æ¡ng cho khÃ³a há»c nÃ y',
      );
    }

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
