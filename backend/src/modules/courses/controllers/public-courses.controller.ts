import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KhoaHoc } from '../entities/course.entity';

@Controller('public/courses')
export class PublicCoursesController {
  constructor(
    @InjectRepository(KhoaHoc)
    private readonly khoaHocRepository: Repository<KhoaHoc>,
  ) {}

  @Get()
  async getAllCourses(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('price') price?: string,
  ) {
    const query = this.khoaHocRepository.createQueryBuilder('khoaHoc')
      .leftJoinAndSelect('khoaHoc.giangVien', 'giangVien')
      .leftJoinAndSelect('khoaHoc.danhMuc', 'danhMuc');

    if (search) {
      query.andWhere('khoaHoc.tenKhoaHoc LIKE :search', { search: `%${search}%` });
    }

    if (categoryId) {
      query.andWhere('khoaHoc.maDM = :categoryId', { categoryId: parseInt(categoryId) });
    }

    if (price === 'free') {
      query.andWhere('khoaHoc.giaBan = 0');
    }

    query.orderBy('khoaHoc.maKH', 'DESC');

    const courses = await query.getMany();
    return {
      message: 'Lấy danh sách khóa học thành công',
      data: courses,
    };
  }

  @Get(':id')
  async getCourseById(@Param('id') id: string) {
    const course = await this.khoaHocRepository.findOne({
      where: { maKH: parseInt(id) },
      relations: ['giangVien', 'danhMuc'],
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    return {
      message: 'Lấy chi tiết khóa học thành công',
      data: course,
    };
  }
}
