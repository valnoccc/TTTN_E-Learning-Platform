import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Lesson } from './entities/lesson.entity';
import { LessonsController } from './controllers/lesson-instructor.controller';
import { LessonsService } from './services/lessons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson]), CloudinaryModule],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
