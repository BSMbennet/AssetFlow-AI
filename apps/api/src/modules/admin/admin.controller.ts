import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  async overview() {
    const [users, organizations, assets, pendingPayments] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.asset.count({ where: { deletedAt: null } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
    ]);
    return { users, organizations, assets, pendingPayments, generatedAt: new Date().toISOString() };
  }
}
