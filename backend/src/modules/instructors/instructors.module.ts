import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InstructorsController } from './controllers/instructors.controller'; // Hoặc đường dẫn chuẩn của bạn
import { PublicInstructorsController } from './controllers/public-instructors.controller';
import { InstructorsService } from './services/instructors.service';

// 1. Import các Entity cần thiết
import { User } from '../users/entities/user.entity';
import { HoSoGiangVien } from './entities/ho-so-giang-vien.entity';
import { BangCapGiangVien } from './entities/bang-cap-giang-vien.entity';
import { KinhNghiemGiangVien } from './entities/kinh-nghiem-giang-vien.entity';
import { InstructorProfileDetailsService } from './services/instructor-profile-details.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, HoSoGiangVien, BangCapGiangVien, KinhNghiemGiangVien]), CloudinaryModule],
  controllers: [InstructorsController, PublicInstructorsController],
  providers: [InstructorsService, InstructorProfileDetailsService],
  exports: [InstructorProfileDetailsService],
})
export class InstructorsModule {}
