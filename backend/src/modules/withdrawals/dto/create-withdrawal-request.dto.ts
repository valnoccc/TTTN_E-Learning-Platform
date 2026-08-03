import { IsNumber, IsPositive } from 'class-validator';

export class CreateWithdrawalRequestDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  soTien!: number;
}
