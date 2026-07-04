import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'khoa-bi-mat'),
    });
  }

  /**
   * Validate JWT payload và kiểm tra trạng thái tài khoản.
   * Nếu tài khoản bị BLOCKED → ném UnauthorizedException ngay lập tức.
   */
  async validate(payload: { sub: number; email: string; vaiTro: string }) {
    // Truy vấn nhanh để kiểm tra AccountStatus
    const rows = await this.dataSource.query(
      `SELECT AccountStatus FROM NguoiDung WHERE MaND = ?`,
      [payload.sub],
    );

    if (rows.length === 0) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    const accountStatus: string = rows[0].AccountStatus;

    if (accountStatus === 'BLOCKED') {
      throw new UnauthorizedException(
        'Tài khoản của bạn đã bị khóa do vi phạm điều khoản sử dụng. Vui lòng liên hệ hỗ trợ.',
      );
    }

    // Trả về user object cho các Request sau
    return {
      sub: payload.sub,
      email: payload.email,
      vaiTro: payload.vaiTro,
      accountStatus,
    };
  }
}
