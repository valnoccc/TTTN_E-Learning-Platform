import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import { StudentCouponsService } from '../services/student-coupons.service';

@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class PublicCouponsController {
  constructor(private readonly couponsService: StudentCouponsService) {}

  @Post('validate')
  async validateCoupon(@Body() body: ValidateCouponDto, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    const data = await this.couponsService.validateCoupon(body, userId);

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
