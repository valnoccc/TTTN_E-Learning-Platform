import { Body, Controller, Post, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import type { PaymentRequest } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('available-coupons')
  async getAvailableCoupons(@Query('courseIds') courseIdsStr: string) {
    return this.checkoutService.getAvailableCoupons(courseIdsStr);
  }

  @Post('process-payment')
  @UseGuards(JwtAuthGuard)
  async processPayment(@Body() payload: PaymentRequest, @Request() req) {
    const userId = req.user.sub || req.user.maND; // sub is the standard JWT ID field from our JwtStrategy
    return this.checkoutService.processPayment(payload, userId);
  }
}
