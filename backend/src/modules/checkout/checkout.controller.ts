import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import type { PaymentRequest } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('process-payment')
  @UseGuards(JwtAuthGuard)
  async processPayment(@Body() payload: PaymentRequest, @Request() req) {
    const userId = req.user.sub || req.user.maND; // sub is the standard JWT ID field from our JwtStrategy
    return this.checkoutService.processPayment(payload, userId);
  }
}
