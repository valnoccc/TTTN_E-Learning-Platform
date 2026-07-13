import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { WishlistService } from './wishlist.service';

type AuthRequest = Request & { user: { sub?: number; maND?: number } };

@Controller()
@UseGuards(JwtAuthGuard)
export class CartWishlistController {
  constructor(
    private readonly cartService: CartService,
    private readonly wishlistService: WishlistService,
  ) {}

  private getUserId(req: AuthRequest): number {
    const userId = req.user.sub ?? req.user.maND;
    if (userId === undefined || userId === null) {
      throw new ForbiddenException('Access denied');
    }
    return userId;
  }

  // ─── CART endpoints ────────────────────────────────────────────────────────

  /** GET /cart — Lấy danh sách khóa học trong giỏ */
  @Get('cart')
  getCart(@Req() req: AuthRequest) {
    return this.cartService.getCart(this.getUserId(req));
  }

  /** POST /cart/add — Thêm khóa học vào giỏ */
  @Post('cart/add')
  addToCart(
    @Req() req: AuthRequest,
    @Body('courseId') courseId: number,
  ) {
    return this.cartService.addToCart(this.getUserId(req), Number(courseId));
  }

  /** DELETE /cart/remove/:courseId — Xóa một khóa học khỏi giỏ */
  @Delete('cart/remove/:courseId')
  removeFromCart(
    @Req() req: AuthRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.cartService.removeFromCart(
      this.getUserId(req),
      Number(courseId),
    );
  }

  /** DELETE /cart/clear — Xóa toàn bộ giỏ hàng */
  @Delete('cart/clear')
  clearCart(@Req() req: AuthRequest) {
    return this.cartService.clearCart(this.getUserId(req));
  }

  /**
   * POST /cart/sync — Sync localStorage items lên DB (gọi một lần khi login)
   * Body: { courseIds: number[] }
   */
  @Post('cart/sync')
  syncCart(
    @Req() req: AuthRequest,
    @Body('courseIds') courseIds: number[],
  ) {
    return this.cartService.syncCartFromClient(this.getUserId(req), courseIds);
  }

  // ─── WISHLIST endpoints ────────────────────────────────────────────────────

  /** GET /wishlist — Lấy danh sách yêu thích */
  @Get('wishlist')
  getWishlist(@Req() req: AuthRequest) {
    return this.wishlistService.getWishlist(this.getUserId(req));
  }

  /** POST /wishlist/toggle — Toggle một khóa học trong wishlist */
  @Post('wishlist/toggle')
  toggleWishlist(
    @Req() req: AuthRequest,
    @Body('courseId') courseId: number,
  ) {
    return this.wishlistService.toggleWishlist(
      this.getUserId(req),
      Number(courseId),
    );
  }

  /** DELETE /wishlist/:courseId — Xóa một khóa học khỏi wishlist */
  @Delete('wishlist/:courseId')
  removeFromWishlist(
    @Req() req: AuthRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.wishlistService.removeFromWishlist(
      this.getUserId(req),
      Number(courseId),
    );
  }

  /**
   * POST /wishlist/sync — Sync localStorage wishlist lên DB (gọi một lần khi login)
   * Body: { courseIds: number[] }
   */
  @Post('wishlist/sync')
  syncWishlist(
    @Req() req: AuthRequest,
    @Body('courseIds') courseIds: number[],
  ) {
    return this.wishlistService.syncWishlistFromClient(
      this.getUserId(req),
      courseIds,
    );
  }
}
