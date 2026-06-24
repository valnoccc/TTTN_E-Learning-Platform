import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PostsService } from '../posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

@Controller('admin/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getAllPosts() {
    const data = await this.postsService.findAll();
    return {
      message: 'Lấy danh sách bài viết thành công',
      data,
    };
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    const data = await this.postsService.findOneById(Number(id));
    return {
      message: 'Lấy chi tiết bài viết thành công',
      data,
    };
  }

  @Post()
  async createPost(
    @Body() dto: CreatePostDto,
    @Req() req: Request & { user: { sub: number } },
  ) {
    const authorId = req.user.sub;
    const data = await this.postsService.create(dto, authorId);
    return {
      message: 'Tạo bài viết thành công',
      data,
    };
  }

  @Put(':id')
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    const data = await this.postsService.update(Number(id), dto);
    return {
      message: 'Cập nhật bài viết thành công',
      data,
    };
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    await this.postsService.remove(Number(id));
    return {
      message: 'Xóa bài viết thành công',
    };
  }
}
