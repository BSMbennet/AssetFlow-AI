import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@Req() req: any) { return this.users.findById(req.user.id); }

  @Patch('me')
  update(@Req() req: any, @Body() body: { firstName?: string; lastName?: string; displayName?: string; phone?: string; timezone?: string; language?: string }) {
    return this.users.updateProfile(req.user.id, body);
  }

  @Get()
  list(@Req() req: any, @Query('skip') skip = '0', @Query('take') take = '50') {
    return this.users.listByOrganization(req.user.organizationId, Math.max(0, Number(skip) || 0), Math.min(100, Math.max(1, Number(take) || 50)));
  }
}
