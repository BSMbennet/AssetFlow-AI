import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cors from 'cors';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const configuredOrigins = (configService.get<string>('CORS_ORIGIN') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction && configuredOrigins.length === 0) {
    throw new Error('CORS_ORIGIN must be configured in production');
  }

  // Render terminates TLS and forwards requests through a trusted proxy. Express must
  // trust exactly the configured number of proxy hops so throttling keys on real clients.
  const proxyHops = Number(configService.get<string>('TRUST_PROXY_HOPS') || (isProduction ? 1 : 0));
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 3) {
    throw new Error('TRUST_PROXY_HOPS must be an integer from 0 to 3');
  }
  app.getHttpAdapter().getInstance().set('trust proxy', proxyHops);

  app.use(helmet());
  app.use(cors({
    origin: configuredOrigins.length ? configuredOrigins : true,
    credentials: true,
  }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api');

  if (!isProduction || configService.get<string>('ENABLE_SWAGGER') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AssetFlow AI API')
      .setDescription('Enterprise RWA Tokenization Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('blockchain', 'Blockchain integration')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
  logger.log(`AssetFlow API running on port ${port}`);
}

bootstrap();
