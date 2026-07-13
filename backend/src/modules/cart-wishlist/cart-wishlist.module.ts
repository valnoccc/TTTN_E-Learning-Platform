import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { WishlistService } from './wishlist.service';
import { CartWishlistController } from './cart-wishlist.controller';

@Module({
  controllers: [CartWishlistController],
  providers: [CartService, WishlistService],
  exports: [CartService, WishlistService],
})
export class CartWishlistModule {}
