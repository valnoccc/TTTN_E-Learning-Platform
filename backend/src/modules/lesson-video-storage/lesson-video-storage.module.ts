import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LessonVideoStorageService } from './lesson-video-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [LessonVideoStorageService],
  exports: [LessonVideoStorageService],
})
export class LessonVideoStorageModule {}
