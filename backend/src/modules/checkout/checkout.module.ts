import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CouponsModule } from '../coupons/coupons.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';

import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [NotificationsModule, CouponsModule, WithdrawalsModule, CoursesModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
