import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  @MaxLength(255)
  TenDM!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  MoTa?: string;
}
