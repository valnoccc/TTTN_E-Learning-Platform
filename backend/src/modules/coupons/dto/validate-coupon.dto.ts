import { IsNotEmpty, IsString, IsArray, IsNumber } from 'class-validator';

export class ValidateCouponDto {
  @IsNotEmpty()
  @IsString()
  maCode!: string;

  @IsArray()
  @IsNumber({}, { each: true })
  courseIds!: number[];
}
