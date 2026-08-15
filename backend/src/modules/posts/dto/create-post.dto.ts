import { IsBoolean, IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  tieuDe!: string;

  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString()
  slug!: string;

  @IsNotEmpty({ message: 'Tóm tắt không được để trống' })
  @IsString()
  tomTat!: string;

  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString()
  noiDung!: string;

  @IsNotEmpty({ message: 'Hình ảnh không được để trống' })
  @IsString()
  hinhAnh!: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'], {
    message: 'Trạng thái phải là DRAFT hoặc PUBLISHED',
  })
  trangThai?: string;

  @IsNotEmpty({ message: 'Danh mục bài viết không được để trống' })
  @IsNumber()
  maDMBV!: number;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}
