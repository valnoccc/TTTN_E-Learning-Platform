import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service'; // Chỉnh lại đường dẫn nếu service nằm ở thư mục khác
import { Category } from './entities/category.entity';

@Module({
  imports: [
    // ⚠️ BẮT BUỘC PHẢI CÓ DÒNG NÀY để NestJS tự động tạo ra "CategoryRepository" cho Service inject vào
    TypeOrmModule.forFeature([Category]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [TypeOrmModule],
})
export class CategoriesModule { }