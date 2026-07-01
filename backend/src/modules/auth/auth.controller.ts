import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.email, body.matKhau ?? body.password);
  }

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(
      body.email,
      body.matKhau ?? body.password,
      body.hoTen ?? body.fullName,
    );
  }

  @Post('change-password')
  changePassword(@Body() body: any) {
    return this.authService.changePassword(
      body.userId,
      body.oldPassword,
      body.newPassword,
    );
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: any) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: any) {
    return this.authService.resetPassword(
      body.token,
      body.email,
      body.newPassword,
    );
  }
}
