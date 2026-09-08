import { Injectable } from '@nestjs/common';

export type SettlementRail = 'Bank rail' | 'Stablecoin rail' | 'Ethereum' | 'Polygon';

export interface SettlementInstructionInput {
  id: string;
  amount: string;
  currency: string;
  direction: 'BUY' | 'SELL';
  settlementNetwork: SettlementRail;
  counterparty?: string | null;
  reference?: string | null;
}

export interface SettlementPrepareResult {
  adapterStatus: 'READY_TO_ROUTE' | 'NOT_CONFIGURED';
  externalReference: string | null;
  message: string;
}

export interface SettlementReconcileResult {
  status: 'UNKNOWN' | 'SETTLED' | 'FAILED';
  externalReference: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
}

export interface SettlementRailAdapter {
  readonly rail: SettlementRail;
  readonly capabilities: string[];
  prepare(input: SettlementInstructionInput): Promise<SettlementPrepareResult>;
  reconcile(input: SettlementInstructionInput & { externalReference?: string | null }): Promise<SettlementReconcileResult>;
}

abstract class ManualAdapter implements SettlementRailAdapter {
  abstract readonly rail: SettlementRail;
  abstract readonly capabilities: string[];

  async prepare(input: SettlementInstructionInput): Promise<SettlementPrepareResult> {
    return {
      adapterStatus: 'READY_TO_ROUTE',
      externalReference: `AF-${input.id.slice(0, 8).toUpperCase()}`,
      message: `${this.rail} adapter contract validated; external execution is not configured.`,
    };
  }

  async reconcile(input: SettlementInstructionInput & { externalReference?: string | null }): Promise<SettlementReconcileResult> {
    return {
      status: 'UNKNOWN',
      externalReference: input.externalReference ?? null,
      failureCode: null,
      failureMessage: 'No live rail adapter is configured; settlement state must be confirmed by the connected venue or custodian.',
    };
  }
}

@Injectable()
export class BankRailAdapter extends ManualAdapter {
  readonly rail = 'Bank rail' as const;
  readonly capabilities = ['instruction-validation', 'routing-contract', 'reconciliation-hook'];
}

@Injectable()
export class StablecoinRailAdapter extends ManualAdapter {
  readonly rail = 'Stablecoin rail' as const;
  readonly capabilities = ['instruction-validation', 'wallet-routing-contract', 'reconciliation-hook'];
}

@Injectable()
export class EthereumSettlementAdapter extends ManualAdapter {
  readonly rail = 'Ethereum' as const;
  readonly capabilities = ['instruction-validation', 'transaction-contract', 'reconciliation-hook'];
}

@Injectable()
export class PolygonSettlementAdapter extends ManualAdapter {
  readonly rail = 'Polygon' as const;
  readonly capabilities = ['instruction-validation', 'transaction-contract', 'reconciliation-hook'];
}

@Injectable()
export class SettlementAdapterRegistry {
  private readonly adapters: Map<SettlementRail, SettlementRailAdapter>;

  constructor(
    bank: BankRailAdapter,
    stablecoin: StablecoinRailAdapter,
    ethereum: EthereumSettlementAdapter,
    polygon: PolygonSettlementAdapter,
  ) {
    this.adapters = new Map([
      [bank.rail, bank],
      [stablecoin.rail, stablecoin],
      [ethereum.rail, ethereum],
      [polygon.rail, polygon],
    ]);
  }

  get(rail: string): SettlementRailAdapter {
    const adapter = this.adapters.get(rail as SettlementRail);
    if (!adapter) throw new Error(`Unsupported settlement rail: ${rail}`);
    return adapter;
  }

  list() {
    return [...this.adapters.values()].map((adapter) => ({ rail: adapter.rail, capabilities: adapter.capabilities, live: false }));
  }
}
