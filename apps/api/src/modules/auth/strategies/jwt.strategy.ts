import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: secret });
  }

  async validate(payload: any) {
    if (payload?.type !== 'access' || !payload?.sub) throw new UnauthorizedException('Invalid access token');
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt || user.status === 'SUSPENDED') throw new UnauthorizedException('User is not active');
    return { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId };
  }
}
