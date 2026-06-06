import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

  async getCoursesByInstructor(instructorId: number) {
    return await this.khoaHocRepository.find({
      where: { maND_GiangVien: instructorId },
      order: { maKH: 'DESC' },
    });
  }

  async createCourse(payload: any) {
    const newCourse = this.khoaHocRepository.create(payload);
    return await this.khoaHocRepository.save(newCourse);
  }

  async remove(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a khÃ³a há»c nÃ y');
    }

    const hasBuyers = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM ChiTietHoaDon WHERE MaKH = ?`,
      [courseId],
    );

    if (hasBuyers[0].count > 0) {
      await this.khoaHocRepository.update(courseId, { trangThai: 'DRAFT' });
      return {
        message:
          'KhÃ³a há»c Ä‘Ã£ cÃ³ há»c viÃªn mua, há»‡ thá»‘ng Ä‘Ã£ chuyá»ƒn sang tráº¡ng thÃ¡i áº¨N.',
      };
    }

    await this.khoaHocRepository.delete(courseId);
    return { message: 'ÄÃ£ xÃ³a khÃ³a há»c thÃ nh cÃ´ng.' };
  }

  async updateCourseStatus(
    courseId: number,
    instructorId: number,
    trangThai: string,
  ) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n sá»­a khÃ³a há»c nÃ y');
    }

    if (trangThai === 'PENDING') {
      const lessonCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM BaiHoc WHERE MaKH = ?`,
        [courseId],
      );

      if (Number(lessonCount[0].count) === 0) {
        throw new BadRequestException(
          'KhÃ³a há»c chÆ°a hoÃ n thiá»‡n. Cáº§n Ã­t nháº¥t 1 bÃ i há»c Ä‘á»ƒ gá»­i duyá»‡t!',
        );
      }
    }

    await this.khoaHocRepository.update(courseId, { trangThai });
    return { message: 'Cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh cÃ´ng' };
  }

  async getCourseById(courseId: number, instructorId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException(
        'KhÃ´ng tÃ¬m tháº¥y khÃ³a há»c hoáº·c báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p',
      );
    }

    return course;
  }

  async updateCourse(courseId: number, instructorId: number, payload: any) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, maND_GiangVien: instructorId },
    });

    if (!course) {
      throw new ForbiddenException('Báº¡n khÃ´ng cÃ³ quyá»n sá»­a khÃ³a há»c nÃ y');
    }

    Object.assign(course, payload);
    return await this.khoaHocRepository.save(course);
  }
}
