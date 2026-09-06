import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is required');
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: secret });
  }
  async validate(payload: any) {
    if (!payload?.sub || !payload?.organizationId) throw new UnauthorizedException('Invalid token claims');
    return { id: payload.sub, email: payload.email, role: payload.role, organizationId: payload.organizationId };
  }
}
