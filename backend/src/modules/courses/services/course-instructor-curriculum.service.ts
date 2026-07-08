import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { KhoaHoc } from '../entities/course.entity';
import { LessonVideoStorageService } from '../../lesson-video-storage/lesson-video-storage.service';

interface ChapterRecord {
  maChuong: number;
  maKH: number;
  tenChuong: string;
  thuTu: number;
}

interface LessonRecord {
  maBH: number;
  maChuong: number;
  tenBaiHoc: string;
  videoUrl: string | null;
  noiDung: string | null;
  thuTu: number;
  thoiLuong: number;
  choPhepXemTruoc?: number | boolean;
}

@Injectable()
export class CourseInstructorCurriculumService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
    private readonly cloudinaryService: CloudinaryService,
    private readonly lessonVideoStorageService: LessonVideoStorageService,
  ) {}

  private async touchCourse(courseId: number) {
    await this.khoaHocRepository.update(courseId, {
      ngayCapNhat: new Date(),
    });
  }

  async getCourseCurriculum(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'Bạn không có quyền xem chương trình giảng dạy của khóa học này',
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

    return Promise.all(
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
        'Bạn không có quyền thêm chương cho khóa học này',
      );
    }

    const result = await this.dataSource.query(
      `INSERT INTO ChuongHoc (MaKH, TenChuong, ThuTu) VALUES (?, ?, ?)`,
      [courseId, payload.tenChuong, payload.thuTu],
    );

    await this.touchCourse(courseId);

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

    await this.touchCourse(payload.maKH);

    const videoUrl = await this.lessonVideoStorageService.getPlayableUrl(null);

    return {
      maBH: result.insertId,
      maKH: payload.maKH,
      maChuong: chapterId,
      tenBaiHoc: payload.tenBaiHoc,
      thuTu: payload.thuTu,
      videoUrl,
      noiDung: null,
      thoiLuong: 0,
    };
  }

  async updateChapter(
    chapterId: number,
    instructorId: number,
    payload: { tenChuong?: string },
  ) {
    const chapter = await this.getOwnedChapter(chapterId, instructorId);
    const nextTitle = payload.tenChuong?.trim();

    await this.dataSource.query(
      `UPDATE ChuongHoc SET TenChuong = ? WHERE MaChuong = ?`,
      [nextTitle || chapter.tenChuong, chapterId],
    );

    const lessons = await this.dataSource.query(
      `SELECT MaBH AS maBH, MaChuong AS maChuong, TenBaiHoc AS tenBaiHoc,
              VideoURL AS videoUrl, NoiDung AS noiDung, ThuTu AS thuTu, ThoiLuong AS thoiLuong, choPhepXemTruoc
       FROM BaiHoc
       WHERE MaChuong = ? AND TrangThai = 'ACTIVE'
       ORDER BY ThuTu ASC`,
      [chapterId],
    );

    await this.touchCourse(chapter.maKH);

    const baiHocs = await Promise.all(
      lessons.sort((a: LessonRecord, b: LessonRecord) => a.thuTu - b.thuTu).map(
        async (lesson: LessonRecord) => ({
          ...lesson,
          videoUrl: await this.lessonVideoStorageService.getPlayableUrl(
            lesson.videoUrl,
          ),
        }),
      ),
    );

    return {
      ...chapter,
      tenChuong: nextTitle || chapter.tenChuong,
      baiHocs,
    };
  }

  async deleteChapter(chapterId: number, instructorId: number) {
    const chapter = await this.getOwnedChapter(chapterId, instructorId);

    const lessonRows: Array<{ maBH?: number | string; videoUrl?: string | null }> =
      await this.dataSource.query(
        `SELECT MaBH AS maBH, VideoURL AS videoUrl
         FROM BaiHoc
         WHERE MaChuong = ? AND VideoURL IS NOT NULL AND VideoURL <> ''`,
        [chapterId],
      );

    await Promise.all(
      lessonRows.map(async (lesson) => {
        const videoUrl = lesson.videoUrl?.trim();
        if (!videoUrl) return;
        await this.deleteStoredVideo(videoUrl);
      }),
    );

    await this.dataSource.query(`DELETE FROM BaiHoc WHERE MaChuong = ?`, [
      chapterId,
    ]);
    await this.dataSource.query(`DELETE FROM ChuongHoc WHERE MaChuong = ?`, [
      chapterId,
    ]);

    await this.touchCourse(chapter.maKH);
  }

  private async deleteStoredVideo(videoUrl: string) {
    try {
      if (videoUrl.includes('cloudinary.com')) {
        const publicId = this.cloudinaryService.extractPublicId(videoUrl);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId, 'video');
        }
        return;
      }

      await this.lessonVideoStorageService.deleteVideo(videoUrl);
    } catch (error) {
      console.error('Khong the xoa video bai hoc khi xoa chuong:', error);
    }
  }

  private async getOwnedChapter(chapterId: number, instructorId: number) {
    const chapters = await this.dataSource.query(
      `SELECT ch.MaChuong AS maChuong, ch.MaKH AS maKH, ch.TenChuong AS tenChuong, ch.ThuTu AS thuTu
       FROM ChuongHoc ch
       INNER JOIN KhoaHoc kh ON kh.MaKH = ch.MaKH
       WHERE ch.MaChuong = ? AND kh.MaND_GiangVien = ?
       LIMIT 1`,
      [chapterId, instructorId],
    );

    const chapter = chapters[0] as ChapterRecord | undefined;
    if (!chapter) {
      throw new ForbiddenException(
        'Bạn không có quyền để thực hiện thao tác này!',
      );
    }

    return chapter;
  }
}
