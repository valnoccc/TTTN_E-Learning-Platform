import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { normalizeRole } from './role-utils';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async login(email: string, pass: string) {
        // 1. Tìm user theo email
        const user = await this.userRepository.findOne({ where: { email } });

        // 2. So sánh mật khẩu nhập vào với mật khẩu đã băm (hash) trong DB
        if (!user || !(await bcrypt.compare(pass, user.matKhau))) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
        }

        // 3. Tạo Payload (Gói hàng) chứa thông tin để nhét vào Token
        const role = normalizeRole(user.vaiTro);
        const payload = { sub: user.maND, email: user.email, role };

        // 4. Trả về Token và thông tin user
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                maND: user.maND,
                hoTen: user.hoTen,
                email: user.email,
                vaiTro: role,
                anhDaiDien: user.anhDaiDien ?? null,
                ngayTao: user.ngayTao,
                id: user.maND,
                fullName: user.hoTen,
                role,
                avatarUrl: user.anhDaiDien ?? null,
                createdAt: user.ngayTao,
            }
        };
    }

    // Thêm hàm Đăng ký
    async register(email: string, pass: string, hoTen: string) {
        // 1. Kiểm tra xem email đã tồn tại chưa (tránh lỗi trùng lặp)
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new UnauthorizedException('Email này đã được sử dụng!');
        }

        // 2. Băm mật khẩu (Mã hóa)
        const hashedPassword = await bcrypt.hash(pass, 10);

        // 3. Lưu vào Database
        const newUser = this.userRepository.create({
            email,
            matKhau: hashedPassword,
            hoTen,
            // Mặc định quyền khi đăng ký là Học viên
        });

        await this.userRepository.save(newUser);
        return { message: 'Đăng ký thành công! Bạn có thể đăng nhập.' };
    }
}
