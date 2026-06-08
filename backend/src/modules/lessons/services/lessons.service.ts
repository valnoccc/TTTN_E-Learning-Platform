import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { Lesson } from '../entities/lesson.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(payload: any): Promise<Lesson> {
    try {
      const result = await this.lessonRepository.save(payload);
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

    const previousVideoUrl = existingLesson.videoURL;
    const nextVideoUrl = payload.videoURL;

    const lesson = await this.lessonRepository.preload({
      maBH: id,
      ...payload,
    });

    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học có ID #${id}`);
    }

    try {
      const updatedLesson = await this.lessonRepository.save(lesson);

      if (previousVideoUrl && nextVideoUrl && previousVideoUrl !== nextVideoUrl) {
        const oldPublicId =
          this.cloudinaryService.extractPublicId(previousVideoUrl);
        if (oldPublicId) {
          await this.cloudinaryService.deleteFile(oldPublicId, 'video');
        }
      }

      return updatedLesson;
    } catch {
      throw new InternalServerErrorException('Lỗi hệ thống khi cập nhật dữ liệu');
    }
  }

  async remove(id: number): Promise<void> {
    const lesson = await this.lessonRepository.findOne({ where: { maBH: id } });
    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học có ID #${id}`);
    }

    if (lesson.videoURL) {
      try {
        const publicId = this.cloudinaryService.extractPublicId(lesson.videoURL);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId, 'video');
        }
      } catch (cloudError) {
        console.error('Lỗi khi xóa video trên Cloudinary:', cloudError);
      }
    }

    try {
      await this.lessonRepository.remove(lesson);
    } catch {
      throw new InternalServerErrorException('Lỗi hệ thống khi xóa dữ liệu');
    }
  }
}
