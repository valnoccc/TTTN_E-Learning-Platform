import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PostCategoriesService } from '../post-categories.service';
import { CreatePostCategoryDto, UpdatePostCategoryDto } from '../dto/post-category.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('admin/post-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPostCategoriesController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Get()
  async findAll() {
    const data = await this.postCategoriesService.findAll();
    return {
      message: 'Lấy danh sách danh mục bài viết thành công',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.postCategoriesService.findOne(Number(id));
    return {
      message: 'Lấy chi tiết danh mục thành công',
      data,
    };
  }

  @Post()
  async create(@Body() dto: CreatePostCategoryDto) {
    const data = await this.postCategoriesService.create(dto);
    return {
      message: 'Tạo danh mục bài viết thành công',
      data,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePostCategoryDto) {
    const data = await this.postCategoriesService.update(Number(id), dto);
    return {
      message: 'Cập nhật danh mục bài viết thành công',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.postCategoriesService.remove(Number(id));
    return {
      message: 'Xóa danh mục bài viết thành công',
    };
  }
}
