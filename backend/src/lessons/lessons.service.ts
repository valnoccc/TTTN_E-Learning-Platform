import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(payload: any): Promise<Lesson> {
    try {
      const result = await this.lessonRepository.save(payload);
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Không thể lưu bài học vào Database');
    }
  }

  async findAllByCourse(courseId: number): Promise<Lesson[]> {
    return await this.lessonRepository.find({
      where: { id_khoa_hoc: courseId },
      order: {
        thu_tu: 'ASC'
      },
    });
  }

  async findOne(id: number): Promise<Lesson | null> {
    return await this.lessonRepository.findOne({
      where: { id },
      relations: ['khoaHoc'], // Nếu bạn muốn lấy thêm thông tin khóa học để làm Breadcrumb
    });
  }

  async update(id: number, payload: any): Promise<Lesson> {
    // 1. Kiểm tra xem bài học có tồn tại không và nạp dữ liệu cũ
    // 'preload' sẽ tạo một entity mới dựa trên ID và các trường trong payload
    const lesson = await this.lessonRepository.preload({
      id: id,
      ...payload,
    });

    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học có ID #${id}`);
    }

    try {
      // 2. Lưu thay đổi xuống Database
      return await this.lessonRepository.save(lesson);
    } catch (error) {
      console.error('Lỗi khi cập nhật bài học:', error);
      throw new InternalServerErrorException('Lỗi hệ thống khi cập nhật dữ liệu');
    }
  }

  async remove(id: number): Promise<void> {
    const lesson = await this.lessonRepository.findOne({ where: { id } });
    if (!lesson) {
      throw new NotFoundException(`Không tìm thấy bài học có ID #${id}`);
    }

    // 1. Nếu có video, tiến hành xóa trên Cloudinary
    if (lesson.video_url) {
      try {
        // Trích xuất public_id từ URL
        // Ví dụ URL: https://res.cloudinary.com/demo/video/upload/v12345/lesson_123.mp4
        // Sẽ lấy ra được chữ: "lesson_123"
        const urlParts = lesson.video_url.split('/');
        const fileNameWithExt = urlParts[urlParts.length - 1]; // "lesson_123.mp4"
        const publicId = fileNameWithExt.split('.')[0]; // "lesson_123"

        // Gọi hàm xóa
        await this.cloudinaryService.deleteFile(publicId);
      } catch (cloudError) {
        console.error('Lỗi khi xóa video trên Cloudinary:', cloudError);
        // Vẫn tiếp tục chạy xuống dưới để xóa DB dù Cloudinary có lỗi (tránh kẹt rác)
      }
    }

    // 2. Tiến hành xóa bản ghi trong MySQL
    try {
      await this.lessonRepository.remove(lesson);
    } catch (error) {
      console.error('Lỗi khi xóa bài học trong DB:', error);
      throw new InternalServerErrorException('Lỗi hệ thống khi xóa dữ liệu');
    }
  }

}