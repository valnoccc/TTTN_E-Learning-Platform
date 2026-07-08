import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { PublicCouponsController } from './controllers/public-coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { AdminCouponsService } from './services/admin-coupons.service';
import { StudentCouponsService } from './services/student-coupons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, KhoaHoc])],
  controllers: [AdminCouponsController, PublicCouponsController],
  providers: [AdminCouponsService, StudentCouponsService],
  exports: [AdminCouponsService, StudentCouponsService],
})
export class CouponsModule {}
