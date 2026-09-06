import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/auth.dto';
import { User, UserRole } from '@assetflow/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { organization: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)) || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { passwordHash, mfaSecret, ...result } = user;
    return result;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('User with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const organization = await this.prisma.organization.create({ data: {
      name: `${dto.firstName} ${dto.lastName}'s Organization`,
      legalName: dto.companyName || `${dto.firstName} ${dto.lastName}`,
      type: dto.organizationType || 'OTHER',
      registrationNumber: `REG-${crypto.randomUUID()}`,
      taxId: `TAX-${crypto.randomUUID()}`,
      country: dto.country || 'US',
      city: dto.city || 'New York',
      address: dto.address || '',
      postalCode: dto.postalCode || '10001',
      contactEmail: email,
      contactPhone: dto.phone || '',
      status: 'PENDING',
    }});

    const user = await this.prisma.user.create({ data: {
      email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
      phone: dto.phone,
      role: UserRole.INVESTOR,
      status: 'PENDING_VERIFICATION',
      organizationId: organization.id,
      emailVerified: false,
      mfaEnabled: false,
    }, include: { organization: true } });

    const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
    return safeUser;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, organizationId: user.organizationId, type: 'access' };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign({ sub: user.id, type: 'refresh' }, {
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '30d',
    });
    await this.prisma.refreshToken.create({ data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }});
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
        role: user.role, organizationId: user.organizationId, organization: user.organization,
      },
    };
  }

  async refreshToken(token: string) {
    let payload: { sub?: string; type?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh' || !payload.sub) throw new UnauthorizedException('Invalid refresh token');

    const stored = await this.prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
    if (!stored || stored.revoked || stored.expiresAt < new Date() || stored.user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = this.jwtService.sign({
      sub: stored.userId,
      email: stored.user.email,
      role: stored.user.role,
      organizationId: stored.user.organizationId,
      type: 'access',
    });
    const newRefreshToken = this.jwtService.sign({ sub: stored.userId, type: 'refresh' }, {
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '30d',
    });

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } }),
      this.prisma.refreshToken.create({ data: {
        userId: stored.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }}),
    ]);
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { organization: true, kycChecks: { orderBy: { submittedAt: 'desc' }, take: 1 } } });
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash, mfaSecret, ...result } = user;
    return result as User;
  }

  async forgotPassword(_email: string) {
    // Password-reset delivery is intentionally not implemented here. Never issue or return
    // an access/refresh token as a password-reset credential.
    return;
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'password-reset' || !payload.sub) throw new UnauthorizedException('Invalid token');
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('Invalid token');
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
      await this.prisma.refreshToken.updateMany({ where: { userId: user.id, revoked: false }, data: { revoked: true } });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
