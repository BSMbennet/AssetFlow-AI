import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, mfaSecret, ...safeUser } = user;
    return safeUser;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const { passwordHash, mfaSecret, ...safeUser } = user;
    return safeUser;
  }

  async listByOrganization(organizationId: string, skip = 0, take = 50) {
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { organizationId, deletedAt: null },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          displayName: true, phone: true, role: true, status: true,
          walletAddress: true, emailVerified: true, mfaEnabled: true,
          lastLoginAt: true, createdAt: true, updatedAt: true,
        },
        orderBy: { createdAt: 'desc' }, skip, take,
      }),
      this.prisma.user.count({ where: { organizationId, deletedAt: null } }),
    ]);
    return { data: users, total, skip, take };
  }

  async updateProfile(id: string, data: { firstName?: string; lastName?: string; displayName?: string; phone?: string; timezone?: string; language?: string }) {
    const user = await this.prisma.user.update({ where: { id }, data });
    const { passwordHash, mfaSecret, ...safeUser } = user;
    return safeUser;
  }
}
