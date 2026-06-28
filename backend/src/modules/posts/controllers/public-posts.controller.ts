import { Controller, Get, Param, Query } from '@nestjs/common';
import { PostsService } from '../posts.service';

@Controller('posts')
export class PublicPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getPublishedPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit || '10', 10) || 10),
    );

    const result = await this.postsService.findPublished(
      pageNum,
      limitNum,
      search,
    );

    return {
      message: 'Lấy danh sách bài viết thành công',
      ...result,
    };
  }

  @Get(':slug')
  async getPostBySlug(@Param('slug') slug: string) {
    const post = await this.postsService.findBySlug(slug);

    return {
      message: 'Lấy chi tiết bài viết thành công',
      data: post,
    };
  }
}
