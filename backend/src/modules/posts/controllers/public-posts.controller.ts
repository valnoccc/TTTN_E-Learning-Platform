import { Controller, Get, Param, Query, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PostsService } from '../posts.service';
import { ArticleCategory } from '../entities/post.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('posts')
export class PublicPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getPublishedPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: ArticleCategory,
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
      category,
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

  @Post(':id/notify-save')
  @UseGuards(JwtAuthGuard)
  async notifySave(
    @Param('id') id: string,
    @Body('isSaving') isSaving: boolean,
    @Req() req: any,
  ) {
    await this.postsService.notifySave(Number(id), req.user.maND, isSaving);
    return {
      message: 'Đã gửi thông báo',
    };
  }
}
