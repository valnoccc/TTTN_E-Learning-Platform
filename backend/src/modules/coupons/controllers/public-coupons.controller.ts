import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import { CouponsService } from '../services/coupons.service';

@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class PublicCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  async validateCoupon(@Body() body: ValidateCouponDto) {
    const data = await this.couponsService.validateCoupon(body);

    return {
      message: 'Kiểm tra mã giảm giá thành công',
      data,
    };
  }

  @Post(':id/consume')
  async consumeCouponUsage(@Param('id') id: string) {
    const data = await this.couponsService.consumeCouponUsage(Number(id));

    return {
      message: 'Đã cập nhật lượt sử dụng mã giảm giá',
      data,
    };
  }
}
