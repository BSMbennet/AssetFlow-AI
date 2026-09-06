import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { RedisThrottlerStorage } from './common/rate-limit/redis-throttler.storage';

function boundedInt(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const legacyPeriodSeconds = config.get<string>('RATE_LIMIT_PERIOD');
        const ttl = boundedInt(
          config.get<string>('RATE_LIMIT_TTL_MS') || (legacyPeriodSeconds ? String(Number(legacyPeriodSeconds) * 1000) : undefined),
          60_000,
          1_000,
          3_600_000,
        );
        const limit = boundedInt(config.get<string>('RATE_LIMIT_LIMIT') || config.get<string>('RATE_LIMIT_REQUESTS'), 60, 1, 10_000);
        return [{ ttl, limit, storage: new RedisThrottlerStorage(config) }];
      },
    }),
    PrismaModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    PaymentsModule,
    BlockchainModule,
    AdminModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
