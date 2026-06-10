import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  // Hàm lấy toàn bộ danh mục cho Giảng viên lựa chọn khi tạo khóa học
  async findAll() {
    return this.categoryRepo.find({
      select: ['maDM', 'tenDM'], // Chỉ bốc các cột cần thiết cho ô select box để tối ưu tốc độ
      order: { tenDM: 'ASC' }, // Sắp xếp Alphabet từ A-Z
    });
  }
}
