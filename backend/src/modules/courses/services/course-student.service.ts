import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { KhoaHoc } from '../entities/course.entity';

@Injectable()
export class CourseStudentService {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
    private readonly dataSource: DataSource,
  ) {}

  async getAllPublishedCourses() {
    return await this.khoaHocRepository.find({
      where: { trangThai: 'PUBLISHED' },
      order: { maKH: 'DESC' },
      relations: ['giangVien'],
    });
  }

  async getPublishedCourseById(courseId: number) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: courseId, trangThai: 'PUBLISHED' },
      relations: ['giangVien'],
    });

    if (!course) {
      throw new NotFoundException(
        'Không tìm thấy khóa học hoặc khóa học chưa được xuất bản',
      );
    }

    const mucTieuData = await this.dataSource.query(
      `SELECT NoiDung FROM MucTieuKhoaHoc WHERE MaKH = ?`,
      [courseId],
    );
    const yeuCauData = await this.dataSource.query(
      `SELECT NoiDung FROM YeuCauKhoaHoc WHERE MaKH = ?`,
      [courseId],
    );

    return {
      ...course,
      muc_tieu: mucTieuData.map((item: any) => item.NoiDung),
      yeu_cau: yeuCauData.map((item: any) => item.NoiDung),
    };
  }
}
