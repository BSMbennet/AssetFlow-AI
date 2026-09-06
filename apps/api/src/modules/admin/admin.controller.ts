import { Controller, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  async overview(@Req() req: any) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) throw new ForbiddenException('Admin access required');
    const org = req.user.organizationId;
    const [users, organizations, assets, pendingPayments] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { organizationId: org } }),
      this.prisma.organization.count({ where: { id: org } }),
      this.prisma.asset.count({ where: { organizationId: org } }),
      this.prisma.payment.count({ where: { user: { organizationId: org }, status: 'PENDING' } }),
    ]);
    return { users, organizations, assets, pendingPayments, generatedAt: new Date().toISOString() };
  }
}
