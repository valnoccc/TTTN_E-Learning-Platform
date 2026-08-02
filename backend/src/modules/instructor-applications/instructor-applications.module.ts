import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { InstructorsModule } from '../instructors/instructors.module';
import { User } from '../users/entities/user.entity';
import { HoSoGiangVien } from '../instructors/entities/ho-so-giang-vien.entity';
import { InstructorApplicationsController } from './controllers/instructor-applications.controller';
import { InstructorApplicationsService } from './services/instructor-applications.service';

@Module({
  imports: [AuthModule, InstructorsModule, TypeOrmModule.forFeature([User, HoSoGiangVien])],
  controllers: [InstructorApplicationsController],
  providers: [InstructorApplicationsService],
})
export class InstructorApplicationsModule {}
