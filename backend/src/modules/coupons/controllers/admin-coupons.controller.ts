import {
  Body,
  Controller,
  Delete,
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
import { CreateAdminCouponDto } from '../dto/create-admin-coupon.dto';
import { QueryCouponsDto } from '../dto/query-coupons.dto';
import { UpdateCouponStatusDto } from '../dto/update-coupon-status.dto';
import { AdminCouponsService } from '../services/admin-coupons.service';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCouponsController {
  constructor(private readonly adminCouponsService: AdminCouponsService) {}

  private getAdminId(request: Request & { user: { sub: number } }) {
    return request.user.sub;
  }

  @Get()
  async getAdminCoupons(@Query() query: QueryCouponsDto) {
    const data = await this.adminCouponsService.getAdminCoupons(query);

    return {
      message: 'Lấy danh sách mã giảm giá admin thành công',
      data,
    };
  }

  @Post()
  async createCoupon(
    @Req() req: Request & { user: { sub: number } },
    @Body() body: CreateAdminCouponDto,
  ) {
    const data = await this.adminCouponsService.createAdminCoupon(
      this.getAdminId(req),
      body,
    );

    return {
      message: 'Tạo mã giảm giá admin thành công',
      data,
    };
  }

  @Patch(':id/status')
  async updateCouponStatus(
    @Req() req: Request & { user: { sub: number } },
    @Param('id') id: string,
    @Body() body: UpdateCouponStatusDto,
  ) {
    const data = await this.adminCouponsService.updateAdminCouponStatus(
      this.getAdminId(req),
      Number(id),
      body.trangThai,
    );

    return {
      message: 'Cập nhật trạng thái mã giảm giá thành công',
      data,
    };
  }

  @Delete(':id')
  async deleteCoupon(
    @Req() req: Request & { user: { sub: number } },
    @Param('id') id: string,
  ) {
    const data = await this.adminCouponsService.deleteAdminCoupon(
      this.getAdminId(req),
      Number(id),
    );

    return {
      message: 'Xóa mã giảm giá thành công',
      data,
    };
  }
}
