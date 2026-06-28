import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './controllers/user-admin.controller';
import { UserAdminController } from './controllers/user-admin-management.controller';
import { UsersService } from './services/users.service';
import { UserAdminService } from './services/user-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, UserAdminController],
  providers: [UsersService, UserAdminService],
  exports: [UsersService],
})
export class UsersModule {}
