import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { QueryCouponsDto } from '../dto/query-coupons.dto';
import { UpdateCouponStatusDto } from '../dto/update-coupon-status.dto';
import { CouponsService } from '../services/coupons.service';

@Controller('instructor/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('INSTRUCTOR')
export class InstructorCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  private getInstructorId(request: Request & { user: { sub: number } }) {
    return request.user.sub;
  }

  @Get()
  async getInstructorCoupons(
    @Req() req: Request & { user: { sub: number } },
    @Query() query: QueryCouponsDto,
  ) {
    const data = await this.couponsService.getInstructorCoupons(
      this.getInstructorId(req),
      query,
    );

    return {
      message: 'Lấy danh sách mã giảm giá thành công',
      data,
    };
  }

  @Post()
  async createCoupon(
    @Req() req: Request & { user: { sub: number } },
    @Body() body: CreateCouponDto,
  ) {
    const data = await this.couponsService.createCoupon(
      this.getInstructorId(req),
      body,
    );

    return {
      message: 'Tạo mã giảm giá thành công',
      data,
    };
  }

  @Patch(':id/status')
  async updateCouponStatus(
    @Req() req: Request & { user: { sub: number } },
    @Param('id') id: string,
    @Body() body: UpdateCouponStatusDto,
  ) {
    const data = await this.couponsService.updateCouponStatus(
      this.getInstructorId(req),
      Number(id),
      body.trangThai,
    );

    return {
      message: 'Cập nhật trạng thái mã giảm giá thành công',
      data,
    };
  }
}
