import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  tieuDe!: string;

  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString()
  slug!: string;

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
}
