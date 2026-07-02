import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { normalizeRole } from '../../common/utils/role-utils';
import axios from 'axios';

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

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User) {
    const vaiTro = normalizeRole(user.vaiTro);
    const payload = { sub: user.maND, email: user.email, vaiTro };

    return {
      access_token: this.jwtService.sign(payload),
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
        phone: user.soDienThoai ?? null,
        soDienThoai: user.soDienThoai ?? null,
      },
    };
  }

  async googleLogin(token: string) {
    // Gọi API Google lấy thông tin user từ access_token
    let googleUser: { email: string; name: string; picture: string };
    try {
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      googleUser = {
        email: data.email,
        name: data.name,
        picture: data.picture,
      };
    } catch {
      throw new UnauthorizedException('Token Google không hợp lệ hoặc đã hết hạn!');
    }

    // Kiểm tra email đã tồn tại trong DB chưa
    let user = await this.userRepository.findOne({ where: { email: googleUser.email } });

    if (!user) {
      // Tạo tài khoản mới tự động
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = this.userRepository.create({
        email: googleUser.email,
        hoTen: googleUser.name,
        anhDaiDien: googleUser.picture,
        matKhau: hashedPassword,
      });
      await this.userRepository.save(user);
    } else if (googleUser.picture && !user.anhDaiDien) {
      // Cập nhật ảnh nếu chưa có
      await this.userRepository.update(user.maND, { anhDaiDien: googleUser.picture });
      user.anhDaiDien = googleUser.picture;
    }

    return this.buildAuthResponse(user);
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

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống!');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1); // 1 hour expiration

    await this.userRepository.update(user.maND, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: tokenExpires,
    });

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}&email=${email}`;
    const message = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu.\n\nHãy click vào link sau để đặt lại mật khẩu: \n${resetUrl}\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.`;

    try {
      let transporter: nodemailer.Transporter;

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Cấu hình dùng Gmail thật
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Fallback dùng mail test
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      const info = await transporter.sendMail({
        from: process.env.SMTP_USER
          ? `"EDUMEO Support" <${process.env.SMTP_USER}>`
          : '"Hỗ trợ E-Learning" <support@elearning.com>',
        to: user.email,
        subject: 'Yêu cầu đặt lại mật khẩu - EDUMEO',
        text: message,
      });

      console.log('Message sent: %s', info.messageId);
      if (!process.env.SMTP_USER) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return {
        message:
          'Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra email của bạn!',
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException(
        'Không thể gửi email lúc này. Vui lòng thử lại sau.',
      );
    }
  }

  async resetPassword(token: string, email: string, newPass: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Email không hợp lệ!');
    }

    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      throw new BadRequestException(
        'Mã xác nhận không hợp lệ hoặc đã hết hạn!',
      );
    }

    if (new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Mã xác nhận đã hết hạn!');
    }

    const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValidToken) {
      throw new BadRequestException('Mã xác nhận không hợp lệ!');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    user.matKhau = hashedPassword;
    user.resetPasswordToken = null as any;
    user.resetPasswordExpires = null as any;
    await this.userRepository.save(user);

    return { message: 'Mật khẩu đã được đặt lại thành công!' };
  }
}
