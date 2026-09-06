import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@Req() req: any) { return this.users.findById(req.user.id); }

  @Patch('me')
  update(@Req() req: any, @Body() body: UpdateProfileDto) {
    return this.users.updateProfile(req.user.id, body);
  }

  @Get()
  list(@Req() req: any, @Query('skip') skip = '0', @Query('take') take = '50') {
    const parsedSkip = Number.parseInt(skip, 10);
    const parsedTake = Number.parseInt(take, 10);
    return this.users.listByOrganization(
      req.user.organizationId,
      Number.isFinite(parsedSkip) ? Math.max(0, parsedSkip) : 0,
      Number.isFinite(parsedTake) ? Math.min(100, Math.max(1, parsedTake)) : 50,
    );
  }
}
