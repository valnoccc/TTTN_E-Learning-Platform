import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CauHoiDienDan } from './entities/cau-hoi-dien-dan.entity';
import { TheTuDienDan } from './entities/the-tu-dien-dan.entity';
import { CauTraLoiDienDan } from './entities/cau-tra-loi-dien-dan.entity';
import { User } from '../users/entities/user.entity';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CauHoiDienDan, TheTuDienDan, CauTraLoiDienDan, User]),
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [ForumController],
  providers: [ForumService],
  exports: [ForumService],
})
export class ForumModule {}
