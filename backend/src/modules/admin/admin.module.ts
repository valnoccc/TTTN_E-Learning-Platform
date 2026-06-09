// src/modules/admin/admin-dashboard.module.ts

import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminDashboardController],
  providers: [AdminService],
})
export class AdminDashboardModule { }
