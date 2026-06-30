import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { PublicCouponsController } from './controllers/public-coupons.controller';
import { InstructorCouponsController } from './controllers/instructor-coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { CouponsService } from './services/coupons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, KhoaHoc])],
  controllers: [
    AdminCouponsController,
    InstructorCouponsController,
    PublicCouponsController,
  ],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
