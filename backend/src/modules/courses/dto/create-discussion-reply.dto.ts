import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDiscussionReplyDto {
  @IsNumber({}, { message: 'ID cuộc thảo luận gốc phải là số' })
  @IsNotEmpty({ message: 'Thiếu ID cuộc thảo luận gốc' })
  parentId!: number;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung phản hồi không được để trống' })
  noiDung!: string;
}
