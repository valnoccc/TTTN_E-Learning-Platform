import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'khoa-bi-mat',
    });
  }

  async validate(payload: { sub: number; email: string; role: string }) {
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
