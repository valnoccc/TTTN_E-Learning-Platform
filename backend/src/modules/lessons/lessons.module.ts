import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { LessonVideoStorageModule } from '../lesson-video-storage/lesson-video-storage.module';
import { KhoaHoc } from '../courses/entities/course.entity';
import { Lesson } from './entities/lesson.entity';
import { AiQuotaTracker } from './entities/ai-quota-tracker.entity';
import { LessonsController } from './controllers/lesson-instructor.controller';
import { AiModerationController } from './controllers/ai-moderation.controller';
import { LessonsService } from './services/lessons.service';
import { VideoIntelligenceService } from './services/video-intelligence.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lesson, AiQuotaTracker, KhoaHoc]),
    CloudinaryModule,
    LessonVideoStorageModule,
  ],
  controllers: [LessonsController, AiModerationController],
  providers: [LessonsService, VideoIntelligenceService],
  exports: [VideoIntelligenceService],
})
export class LessonsModule {}
