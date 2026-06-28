import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { KhoaHoc } from '../courses/entities/course.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(KhoaHoc)
    private readonly courseRepo: Repository<KhoaHoc>,
  ) {}

  async findPublic(search?: string) {
    const query = this.categoryRepo
      .createQueryBuilder('category')
      .select(['category.maDM', 'category.tenDM'])
      .orderBy('category.tenDM', 'ASC');

    if (search?.trim()) {
      query.andWhere('LOWER(category.tenDM) LIKE LOWER(:search)', {
        search: `%${search.trim()}%`,
      });
    }

    return query.getMany();
  }

  async findAdmin(search?: string) {
    const query = this.categoryRepo
      .createQueryBuilder('category')
      .select(['category.maDM', 'category.tenDM', 'category.moTa'])
      .orderBy('category.tenDM', 'ASC');

    if (search?.trim()) {
      query.andWhere('LOWER(category.tenDM) LIKE LOWER(:search)', {
        search: `%${search.trim()}%`,
      });
    }

    return query.getMany();
  }

  async create(dto: CreateCategoryDto) {
    const category = this.categoryRepo.create({
      tenDM: dto.TenDM.trim(),
      moTa: dto.MoTa?.trim() || undefined,
    });

    return this.categoryRepo.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.categoryRepo.findOne({ where: { maDM: id } });
    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    if (typeof dto.TenDM === 'string') {
      category.tenDM = dto.TenDM.trim();
    }

    if (dto.MoTa !== undefined) {
      category.moTa = dto.MoTa?.trim() || undefined;
    }

    return this.categoryRepo.save(category);
  }

  async remove(id: number) {
    const category = await this.categoryRepo.findOne({ where: { maDM: id } });
    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    const relatedCourseCount = await this.courseRepo.count({
      where: { maDM: id },
    });
    if (relatedCourseCount > 0) {
      throw new BadRequestException(
        'Không thể xóa danh mục đang được sử dụng bởi khóa học',
      );
    }

    await this.categoryRepo.remove(category);
  }
}
