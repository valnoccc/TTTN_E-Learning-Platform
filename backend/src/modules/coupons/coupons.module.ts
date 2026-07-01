import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { PublicCouponsController } from './controllers/public-coupons.controller';
import { InstructorCouponsController } from './controllers/instructor-coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { AdminCouponsService } from './services/admin-coupons.service';
import { CouponsService } from './services/coupons.service';
import { InstructorCouponsService } from './services/instructor-coupons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, KhoaHoc])],
  controllers: [
    AdminCouponsController,
    InstructorCouponsController,
    PublicCouponsController,
  ],
  providers: [CouponsService, AdminCouponsService, InstructorCouponsService],
  exports: [CouponsService, AdminCouponsService, InstructorCouponsService],
})
export class CouponsModule {}
