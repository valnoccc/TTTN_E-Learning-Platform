import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../entities/lesson.entity';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

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
    } catch (error) {
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
    const lesson = await this.lessonRepository.preload({
      maBH: id,
      ...payload,
    });

    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học có ID #${id}`);
    }

    try {
      return await this.lessonRepository.save(lesson);
    } catch (error) {
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
      try {
        const urlParts = lesson.videoURL.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const publicId = fileNameWithExt.split('.')[0];
        await this.cloudinaryService.deleteFile(publicId);
      } catch (cloudError) {
        console.error('Lỗi khi xóa video trên Cloudinary:', cloudError);
      }
    }

    try {
      await this.lessonRepository.remove(lesson);
    } catch (error) {
      throw new InternalServerErrorException('Lỗi hệ thống khi xóa dữ liệu');
    }
  }
}
