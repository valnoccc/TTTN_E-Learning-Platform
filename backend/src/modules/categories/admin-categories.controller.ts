import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAdminCategories(@Query('search') search?: string) {
    const data = await this.categoriesService.findAdmin(search);
    return {
      message: 'Lấy danh sách danh mục thành công',
      data,
    };
  }

  @Post()
  async createCategory(@Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.create(dto);
    return {
      message: 'Tạo danh mục thành công',
      data,
    };
  }

  @Patch(':id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    const data = await this.categoriesService.update(id, dto);
    return {
      message: 'Cập nhật danh mục thành công',
      data,
    };
  }

  @Delete(':id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.remove(id);
    return {
      message: 'Xóa danh mục thành công',
    };
  }
}
