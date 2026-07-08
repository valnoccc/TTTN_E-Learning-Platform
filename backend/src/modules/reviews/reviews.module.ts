import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReviewsController } from './controllers/reviews.controller';
import { PublicReviewsController } from './controllers/public-reviews.controller';
import { ReviewsService } from './services/reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([KhoaHoc]), NotificationsModule],
  controllers: [ReviewsController, PublicReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
