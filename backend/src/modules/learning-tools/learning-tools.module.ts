import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningToolsController } from './learning-tools.controller';
import { LearningToolsService } from './learning-tools.service';
import { LearningReminder } from './entities/learning-reminder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LearningReminder])],
  controllers: [LearningToolsController],
  providers: [LearningToolsService],
  exports: [LearningToolsService],
})
export class LearningToolsModule {}
