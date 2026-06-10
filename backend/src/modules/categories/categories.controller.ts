import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Controller('categories')
// Không cần UseGuards(JwtAuthGuard) nếu muốn ai cũng xem được danh mục ngoài trang chủ
export class CategoriesController {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  @Get()
  async getAllCategories() {
    return this.categoryRepo.find({
      select: ['maDM', 'tenDM'], // Chỉ lấy các trường cần cho select box
      order: { tenDM: 'ASC' },
    });
  }
}
