import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdvanceSettlementDto, CreateSettlementDto } from './dto/settlement.dto';
import { SettlementService } from './settlement.service';

@Controller('v1/settlements')
@UseGuards(JwtAuthGuard)
export class SettlementController {
  constructor(private readonly settlements: SettlementService) {}

  @Get('adapters')
  adapters() { return this.settlements.adaptersList(); }

  @Get()
  list(@Req() req: any) { return this.settlements.list(req.user.organizationId); }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) { return this.settlements.get(id, req.user.organizationId); }

  @Post()
  create(@Req() req: any, @Body() dto: CreateSettlementDto, @Headers('idempotency-key') headerKey?: string) {
    if (headerKey && !dto.idempotencyKey) dto.idempotencyKey = headerKey;
    return this.settlements.create(req.user, dto);
  }

  @Post(':id/advance')
  advance(@Req() req: any, @Param('id') id: string, @Body() dto: AdvanceSettlementDto) {
    return this.settlements.advance(id, req.user.organizationId, req.user.id, dto.nextStatus);
  }

  @Post(':id/prepare')
  prepare(@Req() req: any, @Param('id') id: string) {
    return this.settlements.prepare(id, req.user.organizationId, req.user.id);
  }

  @Post(':id/reconcile')
  reconcile(@Req() req: any, @Param('id') id: string) {
    return this.settlements.reconcile(id, req.user.organizationId, req.user.id);
  }
}
