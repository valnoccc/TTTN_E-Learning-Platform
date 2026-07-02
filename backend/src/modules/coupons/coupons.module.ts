import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { PublicCouponsController } from './controllers/public-coupons.controller';
import { InstructorCouponsController } from './controllers/instructor-coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { AdminCouponsService } from './services/admin-coupons.service';
import { InstructorCouponsService } from './services/instructor-coupons.service';
import { StudentCouponsService } from './services/student-coupons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, KhoaHoc])],
  controllers: [
    AdminCouponsController,
    InstructorCouponsController,
    PublicCouponsController,
  ],
  providers: [
    AdminCouponsService,
    InstructorCouponsService,
    StudentCouponsService,
  ],
  exports: [
    AdminCouponsService,
    InstructorCouponsService,
    StudentCouponsService,
  ],
})
export class CouponsModule {}
