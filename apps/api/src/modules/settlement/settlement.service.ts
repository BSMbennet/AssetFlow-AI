import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSettlementDto } from './dto/settlement.dto';
import { SettlementAdapterRegistry } from './settlement.adapters';

const TRANSITIONS: Record<string, string[]> = {
  PENDING_REVIEW: ['ELIGIBILITY_CHECK', 'CANCELLED'],
  ELIGIBILITY_CHECK: ['READY', 'FAILED', 'CANCELLED'],
  READY: ['IN_SETTLEMENT', 'CANCELLED'],
  IN_SETTLEMENT: ['SETTLED', 'FAILED'],
  SETTLED: [],
  FAILED: ['ELIGIBILITY_CHECK', 'CANCELLED'],
  CANCELLED: [],
};

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService, private readonly adapters: SettlementAdapterRegistry) {}

  list(organizationId: string) {
    return this.prisma.$queryRawUnsafe(`
      select id, asset_id as "assetId", direction, amount::text as amount, currency,
             settlement_network as "settlementNetwork", counterparty, status,
             settlement_date as "settlementDate", reference, adapter_status as "adapterStatus",
             external_reference as "externalReference", failure_code as "failureCode",
             failure_message as "failureMessage", created_at as "createdAt", updated_at as "updatedAt"
      from public.settlement_instructions
      where organization_id = $1::uuid
      order by created_at desc
    `, organizationId);
  }

  async get(id: string, organizationId: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      select id, asset_id as "assetId", direction, amount::text as amount, currency,
             settlement_network as "settlementNetwork", counterparty, status,
             settlement_date as "settlementDate", reference, adapter_status as "adapterStatus",
             external_reference as "externalReference", failure_code as "failureCode",
             failure_message as "failureMessage", created_at as "createdAt", updated_at as "updatedAt"
      from public.settlement_instructions where id = $1::uuid and organization_id = $2::uuid limit 1
    `, id, organizationId);
    if (!rows[0]) throw new NotFoundException('Settlement instruction not found');
    return rows[0];
  }

  async create(user: { id: string; organizationId: string }, dto: CreateSettlementDto) {
    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Settlement amount must be greater than zero');
    const idempotencyKey = dto.idempotencyKey ?? null;

    if (idempotencyKey) {
      const existing = await this.prisma.$queryRawUnsafe<any[]>(
        `select id, status from public.settlement_instructions where organization_id = $1::uuid and idempotency_key = $2 limit 1`,
        user.organizationId, idempotencyKey,
      );
      if (existing[0]) throw new ConflictException(`Idempotency key already used by settlement ${existing[0].id}`);
    }

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
      insert into public.settlement_instructions
        (organization_id, asset_id, created_by, direction, amount, currency, settlement_network, counterparty, reference, idempotency_key)
      select $1::uuid, a.id, $2::uuid, $3, $4::numeric, $5, $6, $7, $8, $9
      from public.assets a where a.id = $10::uuid and a.organization_id = $1::uuid
      returning id, asset_id as "assetId", direction, amount::text as amount, currency,
                settlement_network as "settlementNetwork", counterparty, status, reference,
                adapter_status as "adapterStatus", created_at as "createdAt"
    `, user.organizationId, user.id, dto.direction, amount, dto.currency, dto.settlementNetwork, dto.counterparty ?? null, dto.reference ?? null, idempotencyKey, dto.assetId);
    if (!rows[0]) throw new NotFoundException('Asset not found in your organization');

    await this.recordEvent(rows[0].id, user.organizationId, user.id, null, 'PENDING_REVIEW', 'INSTRUCTION_CREATED', 'Settlement instruction created');
    return rows[0];
  }

  async advance(id: string, organizationId: string, actorId: string, nextStatus: string) {
    const current = await this.get(id, organizationId);
    if (!TRANSITIONS[current.status]?.includes(nextStatus)) {
      throw new BadRequestException(`Invalid settlement transition: ${current.status} → ${nextStatus}`);
    }

    await this.prisma.$executeRawUnsafe(`
      update public.settlement_instructions set status = $1,
      settlement_date = case when $1 = 'SETTLED' then current_date else settlement_date end
      where id = $2::uuid and organization_id = $3::uuid and status = $4
    `, nextStatus, id, organizationId, current.status);
    await this.recordEvent(id, organizationId, actorId, current.status, nextStatus, 'STATUS_CHANGE', `Status advanced to ${nextStatus}`);
    return this.get(id, organizationId);
  }

  async prepare(id: string, organizationId: string, actorId: string) {
    const current = await this.get(id, organizationId);
    if (current.status !== 'READY') throw new BadRequestException('Settlement must be READY before rail preparation');
    const adapter = this.adapters.get(current.settlementNetwork);
    const result = await adapter.prepare({
      id: current.id,
      amount: current.amount,
      currency: current.currency,
      direction: current.direction,
      settlementNetwork: current.settlementNetwork,
      counterparty: current.counterparty,
      reference: current.reference,
    });

    await this.prisma.$executeRawUnsafe(`
      update public.settlement_instructions
      set adapter_status = $1, external_reference = $2
      where id = $3::uuid and organization_id = $4::uuid
    `, result.adapterStatus, result.externalReference, id, organizationId);
    await this.recordEvent(id, organizationId, actorId, current.status, current.status, 'ADAPTER_PREPARED', result.message);
    return { instruction: await this.get(id, organizationId), adapter: { rail: adapter.rail, capabilities: adapter.capabilities, live: false }, message: result.message };
  }

  async reconcile(id: string, organizationId: string, actorId: string) {
    const current = await this.get(id, organizationId);
    if (!['IN_SETTLEMENT', 'READY'].includes(current.status)) throw new BadRequestException('Settlement is not eligible for reconciliation');
    const adapter = this.adapters.get(current.settlementNetwork);
    const result = await adapter.reconcile({
      id: current.id,
      amount: current.amount,
      currency: current.currency,
      direction: current.direction,
      settlementNetwork: current.settlementNetwork,
      counterparty: current.counterparty,
      reference: current.reference,
      externalReference: current.externalReference,
    });
    await this.prisma.$executeRawUnsafe(`
      update public.settlement_instructions
      set adapter_status = $1, external_reference = coalesce($2, external_reference),
          failure_code = $3, failure_message = $4,
          status = case when $5 = 'SETTLED' then 'SETTLED' when $5 = 'FAILED' then 'FAILED' else status end,
          settlement_date = case when $5 = 'SETTLED' then current_date else settlement_date end
      where id = $6::uuid and organization_id = $7::uuid
    `, result.status, result.externalReference, result.failureCode ?? null, result.failureMessage ?? null, result.status, id, organizationId);
    await this.recordEvent(id, organizationId, actorId, current.status, result.status === 'UNKNOWN' ? current.status : result.status, 'RECONCILIATION', result.failureMessage ?? `Adapter reconciliation returned ${result.status}`);
    return { instruction: await this.get(id, organizationId), adapter: { rail: adapter.rail, live: false }, reconciliation: result };
  }

  adaptersList() { return this.adapters.list(); }

  private async recordEvent(settlementId: string, organizationId: string, actorId: string, fromStatus: string | null, toStatus: string, eventType: string, message: string) {
    await this.prisma.$executeRawUnsafe(`
      insert into public.settlement_events (settlement_id, organization_id, actor_id, from_status, to_status, event_type, message)
      values ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7)
    `, settlementId, organizationId, actorId, fromStatus, toStatus, eventType, message);
  }
}
