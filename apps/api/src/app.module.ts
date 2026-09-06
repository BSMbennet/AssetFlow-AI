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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get<string>('RATE_LIMIT_TTL_MS') || 60_000),
          limit: Number(config.get<string>('RATE_LIMIT_LIMIT') || 60),
          storage: new RedisThrottlerStorage(config),
        },
      ],
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
