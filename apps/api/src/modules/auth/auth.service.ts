import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
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
    if (!user || !(await bcrypt.compare(password, user.passwordHash)) || user.status === 'SUSPENDED') throw new UnauthorizedException('Invalid credentials');
    const { passwordHash, mfaSecret, ...result } = user;
    return result;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('User with this email already exists');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    let organizationId = dto.organizationId;
    if (!organizationId) {
      const organization = await this.prisma.organization.create({ data: {
        name: `${dto.firstName} ${dto.lastName}'s Organization`, legalName: dto.companyName || `${dto.firstName} ${dto.lastName}`,
        type: dto.organizationType || 'OTHER', registrationNumber: `REG-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        taxId: `TAX-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, country: dto.country || 'US', city: dto.city || 'New York',
        address: dto.address || '', postalCode: dto.postalCode || '10001', contactEmail: dto.email, contactPhone: dto.phone || '', status: 'PENDING',
      }});
      organizationId = organization.id;
    }
    const user = await this.prisma.user.create({ data: {
      email: dto.email, firstName: dto.firstName, lastName: dto.lastName, passwordHash,
      phone: dto.phone, role: dto.role || UserRole.INVESTOR, status: 'PENDING_VERIFICATION', organizationId,
      emailVerified: false, mfaEnabled: false,
    }, include: { organization: true } });
    const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
    return safeUser;
  }

  async login(user: any) {
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
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { organization: true, kycChecks: { orderBy: { createdAt: 'desc' }, take: 1 } } });
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
    } catch { throw new UnauthorizedException('Invalid or expired token'); }
  }
}
