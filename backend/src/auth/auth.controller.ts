import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    login(@Body() body: any) {
        return this.authService.login(body.email, body.matKhau ?? body.password);
    }

    // Thêm API này xuống dưới @Post('login')
    @Post('register')
    register(@Body() body: any) {
        return this.authService.register(
            body.email,
            body.matKhau ?? body.password,
            body.hoTen ?? body.fullName,
        );
    }
}
