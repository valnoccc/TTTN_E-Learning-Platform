import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  Request,
  Req,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import type { PaymentRequest, MomoOrderData, VnpayOrderData } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  // â”€â”€â”€ Láº¥y danh sÃ¡ch voucher kháº£ dá»¥ng (YÃªu cáº§u Ä‘Äƒng nháº­p) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('available-coupons')
  @UseGuards(JwtAuthGuard)
  async getAvailableCoupons(
    @Query('courseIds') courseIdsStr: string,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.maND;
    return this.checkoutService.getAvailableCoupons(courseIdsStr, userId);
  }

  // â”€â”€â”€ Táº¡o thanh toÃ¡n MoMo QR Ä‘á»™ng (Cáº§n Ä‘Äƒng nháº­p) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Post('momo/create-payment')
  @UseGuards(JwtAuthGuard)
  async createMomoPayment(@Body() payload: MomoOrderData, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.checkoutService.createMomoPayment(userId, payload);
  }

  // â”€â”€â”€ IPN Webhook tá»« MoMo (PUBLIC - KhÃ´ng dÃ¹ng JwtAuthGuard) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Post('momo-ipn')
  // MoMo requires HTTP 204 to acknowledge the IPN webhook.
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleMomoIPN(@Body() body: any, @Req() req: any) {
    await this.checkoutService.handleMomoIPN(body);
  }

  // â”€â”€â”€ Browser return tá»« MoMo: xÃ¡c thá»±c chá»¯ kÃ½ rá»“i Ä‘á»“ng bá»™ tráº¡ng thÃ¡i â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Post('momo/return')
  @UseGuards(JwtAuthGuard)
  async handleMomoReturn(@Body() body: any, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.checkoutService.handleMomoReturn(body, userId);
  }

  // ———  // ─── Tạo thanh toán VNPay (Cần đăng nhập) ──────────────────────────
  @Post('vnpay/create-payment')
  @UseGuards(JwtAuthGuard)
  async createVnpayPayment(@Body() payload: VnpayOrderData, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.checkoutService.createVnpayPayment(userId, payload);
  }

  // ─── VNPay Return URL (PUBLIC - VNPay redirect về sau khi thanh toán) ─────────
  @Get('vnpay/return')
  @HttpCode(HttpStatus.OK)
  async handleVnpayReturn(@Query() query: Record<string, string>) {
    return this.checkoutService.handleVnpayReturn(query);
  }

  // ─── VNPay IPN Webhook ngầm (PUBLIC) ──────────────────────────────────
  @Get('vnpay-ipn')
  @HttpCode(HttpStatus.OK)
  async handleVnpayIPN(@Query() query: Record<string, string>) {
    return this.checkoutService.handleVnpayIPN(query);
  }

  // ——— Thanh toán thủ công (BANK / VNPAY / PAYPAL) (Cần đăng nhập) —————————————————
  @Post('process-payment')
  @UseGuards(JwtAuthGuard)
  async processPayment(@Body() payload: PaymentRequest, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.checkoutService.processPayment(payload, userId);
  }

  // â”€â”€â”€ Láº¥y chi tiáº¿t hoÃ¡ Ä‘Æ¡n (Cáº§n Ä‘Äƒng nháº­p) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  @Get('invoice/:id')
  @UseGuards(JwtAuthGuard)
  async getInvoiceDetails(@Param('id') invoiceId: string, @Request() req) {
    const userId = req.user.sub || req.user.maND;
    return this.checkoutService.getInvoiceDetails(Number(invoiceId), userId);
  }
}
