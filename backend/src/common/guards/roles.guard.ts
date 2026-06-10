import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách các role được phép từ Decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu API không yêu cầu Role nào, cho phép đi tiếp
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Thông tin user đã được giải mã từ lớp JwtAuthGuard trước đó

    // So sánh trường VaiTro trong Database (STUDENT, INSTRUCTOR, ADMIN)
    // Lưu ý: Đổi user.VaiTro thành trường thực tế mà bạn lưu trong Payload của JWT (có thể là user.role)
    if (!user || !requiredRoles.includes(user.vaiTro)) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào chức năng của Quản trị viên!',
      );
    }

    return true;
  }
}
