import { Controller, Get } from '@nestjs/common';
import { PostCategoriesService } from '../post-categories.service';

@Controller('post-categories')
export class PublicPostCategoriesController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Get()
  async findAll() {
    const data = await this.postCategoriesService.findAll();
    return {
      message: 'Lấy danh sách danh mục bài viết thành công',
      data,
    };
  }
}
