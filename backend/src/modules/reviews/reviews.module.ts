import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewsService } from './services/reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([KhoaHoc])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
