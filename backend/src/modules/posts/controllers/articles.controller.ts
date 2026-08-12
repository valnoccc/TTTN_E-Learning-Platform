import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { ArticleCategory } from '../entities/post.entity';
import { PostsService } from '../posts.service';

type AuthRequest = Request & {
  user: { sub: number };
};

@Controller('articles')
export class ArticlesController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findPublished(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: ArticleCategory,
  ) {
    const result = await this.postsService.findPublished(
      Math.max(1, Number(page) || 1),
      Math.min(50, Math.max(1, Number(limit) || 10)),
      search,
      category,
    );
    return { message: 'Lấy danh sách bài viết thành công', ...result };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Lấy chi tiết bài viết thành công',
      data: await this.postsService.findPublishedById(id),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() dto: CreatePostDto, @Req() req: AuthRequest) {
    return {
      message: 'Tạo bài viết thành công',
      data: await this.postsService.create(dto, req.user.sub),
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ) {
    return {
      message: 'Cập nhật bài viết thành công',
      data: await this.postsService.update(id, dto),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.postsService.remove(id);
    return { message: 'Xóa bài viết thành công' };
  }
}
