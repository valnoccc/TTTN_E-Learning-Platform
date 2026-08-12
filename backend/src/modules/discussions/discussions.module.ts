import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KhoaHoc } from '../courses/entities/course.entity';
import { DiscussionsController } from './controllers/discussions.controller';
import { PublicDiscussionsController } from './controllers/public-discussions.controller';
import { DiscussionsService } from './services/discussions.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([KhoaHoc]), NotificationsModule],
  controllers: [DiscussionsController, PublicDiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService],
})
export class DiscussionsModule {}
