import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  tenDMBV!: string;

  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  moTa?: string;
}

export class UpdatePostCategoryDto {
  @IsOptional()
  @IsString()
  tenDMBV?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  moTa?: string;
}
