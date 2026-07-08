import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

const BLOCKED_STATUSES = new Set(['BLOCKED', 'LOCKED', 'INACTIVE', 'DELETED']);
const BLOCKED_ACCOUNT_MESSAGE =
  'Tài khoản của bạn đã vi phạm nguyên tắc và đã bị đình chỉ. Vui lòng liên hệ bộ phận hỗ trợ.';

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

  async validate(payload: { sub: number; email: string; vaiTro: string }) {
    const rows = await this.dataSource.query(
      `SELECT TrangThai FROM NguoiDung WHERE MaND = ?`,
      [payload.sub],
    );

    if (rows.length === 0) {
      throw new UnauthorizedException('Tài khoản không tồn tại!');
    }

    const trangThai = String(rows[0].TrangThai ?? '').trim().toUpperCase();

    if (BLOCKED_STATUSES.has(trangThai)) {
      throw new UnauthorizedException(BLOCKED_ACCOUNT_MESSAGE);
    }

    return {
      sub: payload.sub,
      email: payload.email,
      vaiTro: payload.vaiTro,
      trangThai: rows[0].TrangThai ?? null,
    };
  }
}
