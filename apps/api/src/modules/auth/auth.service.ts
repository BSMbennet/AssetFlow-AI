import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { organization: true } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role, organizationId: user.organizationId };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, { expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '30d' });
    await this.prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, organizationId: user.organizationId, organization: user.organization } };
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) throw new UnauthorizedException('Invalid refresh token');
    const accessToken = this.jwtService.sign({ sub: stored.userId, email: stored.user.email, role: stored.user.role, organizationId: stored.user.organizationId });
    return { accessToken };
  }

  async logout(userId: string) { await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } }); }

  async getProfile(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { organization: true, kycChecks: { orderBy: { submittedAt: 'desc' }, take: 1 } } });
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash, mfaSecret, ...result } = user;
    return result as User;
  }

  async forgotPassword(_email: string) { return; }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('Invalid token');
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
      return { success: true };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
