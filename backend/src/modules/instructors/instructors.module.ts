import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InstructorsController } from './controllers/instructors.controller'; // Hoặc đường dẫn chuẩn của bạn
import { InstructorsService } from './services/instructors.service';

// 1. Import các Entity cần thiết
import { User } from '../users/entities/user.entity';
import { HoSoGiangVien } from './entities/ho-so-giang-vien.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, HoSoGiangVien]),
    CloudinaryModule,
  ],
  controllers: [InstructorsController],
  providers: [InstructorsService],
})
export class InstructorsModule { }