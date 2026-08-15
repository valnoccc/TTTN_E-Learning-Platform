import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { KhoaHoc } from '../../courses/entities/course.entity';
import { LessonVideoStorageService } from '../../lesson-video-storage/lesson-video-storage.service';
import { Lesson } from '../entities/lesson.entity';
import { LessonVideoVersionService } from './lesson-video-version.service';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(KhoaHoc)
    private readonly courseRepository: Repository<KhoaHoc>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly lessonVideoStorageService: LessonVideoStorageService,
    private readonly lessonVideoVersionService: LessonVideoVersionService,
  ) {}

  private async touchCourse(courseId: number) {
    await this.courseRepository.update(courseId, {
      ngayCapNhat: new Date(),
    });
  }

  async create(payload: any): Promise<Lesson> {
    try {
      const { videoDraft, ...lessonPayload } = payload;
      const result = await this.lessonRepository.save(lessonPayload);
      if (videoDraft && result?.maBH) {
        await this.lessonVideoVersionService.createDraft({
          lessonId: Number(result.maBH),
          ...videoDraft,
        });
      }
      if (result?.maKH) {
        await this.touchCourse(Number(result.maKH));
      }
      return result;
    } catch {
      throw new InternalServerErrorException(
        'Không thể lưu bài học vào Database',
      );
    }
  }

  async findAllByCourse(courseId: number): Promise<Lesson[]> {
    return await this.lessonRepository.find({
      where: { maKH: courseId },
      order: {
        thuTu: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Lesson | null> {
    return await this.lessonRepository.findOne({
      where: { maBH: id },
      relations: ['khoaHoc'],
    });
  }

  async update(id: number, payload: any): Promise<Lesson> {
    const existingLesson = await this.lessonRepository.findOne({
      where: { maBH: id },
    });

    if (!existingLesson) {
      throw new NotFoundException(`Không tìm thấy bài học có ID #${id}`);
    }

    const { videoDraft, ...lessonPayload } = payload;
    const previousVideoUrl = existingLesson.videoURL;
    const course = await this.courseRepository.findOne({
      where: { maKH: existingLesson.maKH },
    });
    const keepPublicVideo = course?.trangThai === 'PUBLISHED' && Boolean(videoDraft);
    const nextVideoUrl = keepPublicVideo ? undefined : lessonPayload.videoURL;

    if (keepPublicVideo) {
      delete lessonPayload.videoURL;
      delete lessonPayload.videoSourceType;
      delete lessonPayload.aiStatus;
      delete lessonPayload.aiLabels;
      delete lessonPayload.aiRejectReason;
      delete lessonPayload.thoiLuong;
      delete lessonPayload.durationSeconds;
      delete lessonPayload.resolution;
    }

    const lesson = await this.lessonRepository.preload({
      maBH: id,
      ...lessonPayload,
    });

    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học có ID #${id}`);
    }

    try {
      const updatedLesson = await this.lessonRepository.save(lesson);
      if (videoDraft) {
        await this.lessonVideoVersionService.createDraft({
          lessonId: id,
          ...videoDraft,
        });
      }
      if (updatedLesson?.maKH) {
        await this.touchCourse(Number(updatedLesson.maKH));
      }

      if (
        !videoDraft &&
        previousVideoUrl &&
        nextVideoUrl &&
        previousVideoUrl !== nextVideoUrl
      ) {
        await this.deletePreviousVideo(previousVideoUrl);
      }

      return updatedLesson;
    } catch {
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi cập nhật dữ liệu',
      );
    }
  }

  async remove(id: number): Promise<void> {
    const lesson = await this.lessonRepository.findOne({ where: { maBH: id } });
    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học có ID #${id}`);
    }

    if (lesson.videoURL) {
      await this.deletePreviousVideo(lesson.videoURL);
    }

    try {
      await this.lessonRepository.remove(lesson);
      await this.touchCourse(Number(lesson.maKH));
    } catch {
      throw new InternalServerErrorException('Lỗi hệ thống khi xóa dữ liệu');
    }
  }

  private async deletePreviousVideo(videoUrl: string): Promise<void> {
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
      console.error('Không thể xóa video cũ:', error);
    }
  }
}
