import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { normalizeRole } from '../../common/utils/role-utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.matKhau')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !(await bcrypt.compare(pass, user.matKhau))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
    }

    const vaiTro = normalizeRole(user.vaiTro);
    const payload = { sub: user.maND, email: user.email, vaiTro };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        maND: user.maND,
        hoTen: user.hoTen,
        email: user.email,
        vaiTro,
        anhDaiDien: user.anhDaiDien ?? null,
        ngayTao: user.ngayTao,
        id: user.maND,
        fullName: user.hoTen,
        avatarUrl: user.anhDaiDien ?? null,
        createdAt: user.ngayTao,
      },
    };
  }

  async register(email: string, pass: string, hoTen: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException('Email này đã được sử dụng!');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    const newUser = this.userRepository.create({
      email,
      matKhau: hashedPassword,
      hoTen,
    });

    await this.userRepository.save(newUser);
    return { message: 'Đăng ký thành công! Bạn có thể đăng nhập.' };
  }

  async changePassword(userId: number, oldPass: string, newPass: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.matKhau')
      .where('user.maND = :userId', { userId })
      .getOne();
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại!');

    if (!(await bcrypt.compare(oldPass, user.matKhau))) {
      throw new UnauthorizedException('Mật khẩu cũ không chính xác!');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.userRepository.update(userId, { matKhau: hashedPassword });
    return { message: 'Đổi mật khẩu thành công!' };
  }
}
