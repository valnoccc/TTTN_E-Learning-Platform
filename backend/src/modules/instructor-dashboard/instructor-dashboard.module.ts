import { Module } from '@nestjs/common';

import { InstructorDashboardController } from './controllers/instructor-dashboard.controller';
import { InstructorDashboardService } from './services/instructor-dashboard.service';

@Module({
  controllers: [InstructorDashboardController],
  providers: [InstructorDashboardService],
})
export class InstructorDashboardModule {}
