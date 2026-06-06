import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateReplyDto {
  @IsNumber({}, { message: 'ID đánh giá gốc phải là số' })
  @IsNotEmpty({ message: 'Thiếu ID đánh giá gốc' })
  parentId!: number;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung phản hồi không được để trống' })
  noiDung!: string;
}
