import { IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';
import { ArticleCategory } from '../entities/post.entity';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  tieuDe?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  tomTat?: string;

  @IsOptional()
  @IsString()
  noiDung?: string;

  @IsOptional()
  @IsString()
  hinhAnh?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'], {
    message: 'Trạng thái phải là DRAFT hoặc PUBLISHED',
  })
  trangThai?: string;

  @IsOptional()
  @IsEnum(ArticleCategory, {
    message: 'Danh mục bài viết không hợp lệ',
  })
  category?: ArticleCategory;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
