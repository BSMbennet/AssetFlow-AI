import { Module } from '@nestjs/common';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { SupabaseOrJwtGuard } from './supabase-or-jwt.guard';

@Module({
  controllers: [BlockchainController],
  providers: [BlockchainService, SupabaseOrJwtGuard],
  exports: [BlockchainService],
})
export class BlockchainModule {}
