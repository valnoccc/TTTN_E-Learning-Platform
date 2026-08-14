import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdateCouponStatusDto {
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsIn(['ACTIVE', 'INACTIVE'], { message: 'Trạng thái không hợp lệ' })
  trangThai!: 'ACTIVE' | 'INACTIVE';
}
