import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Param,
  Body,
  Req,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ForumService } from '../services/forum.service';
import { ForumAdminService } from '../services/forum-admin.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  FilterQuestionDto,
  CreateQuestionDto,
  CreateAnswerDto,
} from '../dto/forum.dto';

@Controller('forum')
export class ForumController {
  constructor(
    private readonly forumService: ForumService,
    private readonly forumAdminService: ForumAdminService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('questions')
  async getQuestions(@Query() filter: FilterQuestionDto) {
    return this.forumService.layDanhSachCauHoi(filter);
  }

  @Get('questions/:id')
  async layChiTietCauHoi(
    @Param('id') id: string,
    @Query('increment') increment?: string,
  ) {
    const shouldIncrement = increment === 'true';
    return this.forumService.layChiTietCauHoi(+id, shouldIncrement);
  }

  @Post('questions')
  @UseGuards(JwtAuthGuard)
  async createQuestion(
    @Req() req: Request & { user: { sub: number } },
    @Body() body: CreateQuestionDto,
  ) {
    const question = await this.forumService.taoCauHoi(req.user.sub, body);
    return { message: 'Tạo câu hỏi thành công', data: question };
  }

  @Post('questions/:id/answers')
  @UseGuards(JwtAuthGuard)
  async createAnswer(
    @Param('id') id: number,
    @Req() req: Request & { user: { sub: number } },
    @Body() body: CreateAnswerDto,
  ) {
    const answer = await this.forumService.taoTraLoi(id, req.user.sub, body);
    return { message: 'Tạo câu trả lời thành công', data: answer };
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Vui lòng cung cấp file ảnh');
    }
    const result = await this.cloudinaryService.uploadFile(file, 'image');
    return { url: result.secure_url };
  }

  @Post('questions/:id/upvote')
  @UseGuards(JwtAuthGuard)
  async upvoteQuestion(
    @Param('id') id: number,
    @Req() req: Request & { user: { sub: number } },
  ) {
    const result = await this.forumService.upvoteQuestion(id, req.user.sub);
    return { message: 'Cập nhật bình chọn câu hỏi thành công', data: result };
  }

  @Post('answers/:id/upvote')
  @UseGuards(JwtAuthGuard)
  async upvoteAnswer(
    @Param('id') id: number,
    @Req() req: Request & { user: { sub: number } },
  ) {
    const result = await this.forumService.upvoteAnswer(id, req.user.sub);
    return {
      message: 'Cập nhật bình chọn câu trả lời thành công',
      data: result,
    };
  }

  @Get('admin/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listAdminQuestions(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.forumAdminService.listRootQuestions({
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return {
      message: 'Lấy danh sách bài đăng diễn đàn thành công',
      ...result,
    };
  }

  @Delete('admin/questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteAdminQuestion(@Param('id', ParseIntPipe) id: number) {
    const result = await this.forumAdminService.deleteQuestion(id);

    return {
      message: 'Xóa bài đăng diễn đàn thành công',
      data: result,
    };
  }
}
