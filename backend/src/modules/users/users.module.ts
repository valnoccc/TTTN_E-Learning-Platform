import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { StudentController } from './controllers/student.controller';
import { UserAdminController } from './controllers/user-admin-management.controller';
import { UsersService } from './services/users.service';
import { UserAdminService } from './services/user-admin.service';
import { StudentProfileService } from './services/student-profile.service';
import { StudentProgressService } from './services/student-progress.service';
import { StudentPaymentHistoryService } from './services/student-payment-history.service';
import { StudentCertificateService } from './services/student-certificate.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, StudentController, UserAdminController],
  providers: [
    UsersService,
    UserAdminService,
    StudentProfileService,
    StudentProgressService,
    StudentPaymentHistoryService,
    StudentCertificateService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
