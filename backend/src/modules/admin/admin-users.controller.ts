import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminUsersService } from './admin-users.service';

type UpdateUserPayload = {
  status?: string;
  role?: string;
};

type BulkUpdatePayload = {
  ids?: number[];
  status?: string;
  role?: string;
};

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminUsersService.getUsers({ search, role, status });
  }

  @Patch('bulk/status')
  async bulkUpdateStatus(@Body() body: BulkUpdatePayload) {
    return this.adminUsersService.bulkUpdateStatus(body.ids ?? [], body.status ?? '');
  }

  @Patch('bulk/role')
  async bulkUpdateRole(@Body() body: BulkUpdatePayload) {
    return this.adminUsersService.bulkUpdateRole(body.ids ?? [], body.role ?? '');
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateUserPayload) {
    return this.adminUsersService.updateUserStatus(Number(id), body.status ?? '');
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() body: UpdateUserPayload) {
    return this.adminUsersService.updateUserRole(Number(id), body.role ?? '');
  }
}
