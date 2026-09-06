import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/auth.dto';
import { User, UserRole } from '@assetflow/shared-types';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { organization: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)) || user.status === 'SUSPENDED' || user.deletedAt) throw new UnauthorizedException('Invalid credentials');
    const { passwordHash, mfaSecret, ...result } = user;
    return result;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('User with this email already exists');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const organization = await this.prisma.organization.create({ data: {
      name: `${dto.firstName} ${dto.lastName}'s Organization`, legalName: dto.companyName || `${dto.firstName} ${dto.lastName}`,
      type: dto.organizationType || 'OTHER', registrationNumber: `REG-${randomUUID()}`, taxId: `TAX-${randomUUID()}`,
      country: dto.country || 'US', city: dto.city || 'New York', address: dto.address || '', postalCode: dto.postalCode || '10001',
      contactEmail: email, contactPhone: dto.phone || '', status: 'PENDING',
    }});
    const user = await this.prisma.user.create({ data: {
      email, firstName: dto.firstName, lastName: dto.lastName, passwordHash, phone: dto.phone,
      role: UserRole.INVESTOR, status: 'PENDING_VERIFICATION', organizationId: organization.id,
      emailVerified: false, mfaEnabled: false,
    }, include: { organization: true } });
    const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
    return safeUser;
  }

  async login(user: any) {
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role, organizationId: user.organizationId, type: 'access' });
    const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, { expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '30d' });
    await this.prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, organizationId: user.organizationId, organization: user.organization } };
  }

  async refreshToken(token: string) {
    let payload: { sub?: string; type?: string };
    try { payload = this.jwtService.verify(token); } catch { throw new UnauthorizedException('Invalid refresh token'); }
    if (payload.type !== 'refresh' || !payload.sub) throw new UnauthorizedException('Invalid refresh token');
    const stored = await this.prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
    if (!stored || stored.revoked || stored.expiresAt < new Date() || stored.user.status === 'SUSPENDED' || stored.user.deletedAt) throw new UnauthorizedException('Invalid refresh token');
    const accessToken = this.jwtService.sign({ sub: stored.userId, email: stored.user.email, role: stored.user.role, organizationId: stored.user.organizationId, type: 'access' });
    const newRefreshToken = this.jwtService.sign({ sub: stored.userId, type: 'refresh' }, { expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '30d' });
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } }),
      this.prisma.refreshToken.create({ data: { userId: stored.userId, token: newRefreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }),
    ]);
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string) { await this.prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } }); }

  async getProfile(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { organization: true, kycChecks: { orderBy: { submittedAt: 'desc' }, take: 1 } } });
    if (!user || user.deletedAt) throw new UnauthorizedException('User not found');
    const { passwordHash, mfaSecret, ...result } = user;
    return result as User;
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.status === 'SUSPENDED' || user.deletedAt) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.passwordReset.updateMany({ where: { userId: user.id, used: false }, data: { used: true, usedAt: new Date() } });
    await this.prisma.passwordReset.create({ data: { userId: user.id, token: tokenHash, expiresAt } });

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const from = this.configService.get<string>('RESET_EMAIL_FROM');
    const frontend = this.configService.get<string>('FRONTEND_URL');
    if (!apiKey || !from || !frontend) {
      if (this.configService.get<string>('NODE_ENV') === 'production') throw new InternalServerErrorException('Password recovery is not configured');
      return;
    }

    let frontendUrl: URL;
    try { frontendUrl = new URL(frontend); } catch { throw new InternalServerErrorException('Password recovery URL is invalid'); }
    if (this.configService.get<string>('NODE_ENV') === 'production' && frontendUrl.protocol !== 'https:') throw new InternalServerErrorException('Password recovery URL is invalid');

    const resetUrl = `${frontendUrl.origin}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [user.email], subject: 'Reset your AssetFlow password', text: `Use this link within 15 minutes to reset your password: ${resetUrl}` }),
    });
    if (!response.ok) {
      await this.prisma.passwordReset.updateMany({ where: { userId: user.id, token: tokenHash, used: false }, data: { used: true, usedAt: new Date() } });
      throw new InternalServerErrorException('Password recovery delivery failed');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token.trim()).digest('hex');
    const now = new Date();
    const reset = await this.prisma.passwordReset.findFirst({ where: { token: tokenHash, used: false, expiresAt: { gt: now } } });
    if (!reset) throw new UnauthorizedException('Invalid or expired token');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    try {
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.passwordReset.updateMany({ where: { id: reset.id, used: false, expiresAt: { gt: now } }, data: { used: true, usedAt: now } });
        if (claimed.count !== 1) throw new UnauthorizedException('Invalid or expired token');
        await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });
        await tx.refreshToken.updateMany({ where: { userId: reset.userId, revoked: false }, data: { revoked: true } });
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
