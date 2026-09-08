import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SettlementController } from './settlement.controller';
import { BankRailAdapter, EthereumSettlementAdapter, PolygonSettlementAdapter, SettlementAdapterRegistry, StablecoinRailAdapter } from './settlement.adapters';
import { SettlementService } from './settlement.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettlementController],
  providers: [
    SettlementService,
    SettlementAdapterRegistry,
    BankRailAdapter,
    StablecoinRailAdapter,
    EthereumSettlementAdapter,
    PolygonSettlementAdapter,
  ],
  exports: [SettlementService, SettlementAdapterRegistry],
})
export class SettlementModule {}
