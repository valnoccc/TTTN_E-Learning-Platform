import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import type { PaymentRequest, MomoOrderData } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  // ─── Lấy danh sách voucher khả dụng (Public) ───────────────────────────────
  @Get('available-coupons')
  async getAvailableCoupons(@Query('courseIds') courseIdsStr: string) {
    return this.checkoutService.getAvailableCoupons(courseIdsStr);
  }

  // ─── Tạo thanh toán MoMo QR động (Cần đăng nhập) ──────────────────────────
  @Post('momo/create-payment')
  @UseGuards(JwtAuthGuard)
  async createMomoPayment(@Body() payload: MomoOrderData, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    console.log('[Controller] createMomoPayment | userId:', userId, '| payload:', JSON.stringify(payload));
    return this.checkoutService.createMomoPayment(userId, payload);
  }

  // ─── IPN Webhook từ MoMo (PUBLIC - Không dùng JwtAuthGuard) ──────────────
  @Post('momo-ipn')
  @HttpCode(HttpStatus.OK)
  async handleMomoIPN(@Body() body: any) {
    console.log('[Controller] handleMomoIPN | body:', JSON.stringify(body));
    return this.checkoutService.handleMomoIPN(body);
  }

  // ─── Thanh toán thủ công (BANK / VNPAY / PAYPAL) (Cần đăng nhập) ──────────
  @Post('process-payment')
  @UseGuards(JwtAuthGuard)
  async processPayment(@Body() payload: PaymentRequest, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.checkoutService.processPayment(payload, userId);
  }

  // ─── Lấy chi tiết hoá đơn (Cần đăng nhập) ─────────────────────────────────
  @Get('invoice/:id')
  @UseGuards(JwtAuthGuard)
  async getInvoiceDetails(@Param('id') invoiceId: string, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.checkoutService.getInvoiceDetails(Number(invoiceId), userId);
  }
}
