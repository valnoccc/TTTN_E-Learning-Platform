import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { LessonVideoStorageModule } from '../lesson-video-storage/lesson-video-storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { KhoaHoc } from '../courses/entities/course.entity';
import { Lesson } from './entities/lesson.entity';
import { AiQuotaTracker } from './entities/ai-quota-tracker.entity';
import { VideoBaiHoc } from './entities/video-bai-hoc.entity';
import { LichSuPublicVideo } from './entities/lich-su-public-video.entity';
import { LessonsController } from './controllers/lesson-instructor.controller';
import { AiModerationController } from './controllers/ai-moderation.controller';
import { LessonsService } from './services/lessons.service';
import { VideoIntelligenceService } from './services/video-intelligence.service';
import { LessonVideoVersionService } from './services/lesson-video-version.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lesson,
      AiQuotaTracker,
      KhoaHoc,
      VideoBaiHoc,
      LichSuPublicVideo,
    ]),
    CloudinaryModule,
    LessonVideoStorageModule,
    NotificationsModule,
  ],
  controllers: [LessonsController, AiModerationController],
  providers: [
    LessonsService,
    VideoIntelligenceService,
    LessonVideoVersionService,
  ],
  exports: [VideoIntelligenceService, LessonVideoVersionService],
})
export class LessonsModule {}
