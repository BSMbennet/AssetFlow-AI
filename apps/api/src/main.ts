import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: configService.get<string>('CORS_ORIGIN')?.split(',') || '*',
      credentials: true,
    })
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('AssetFlow AI API')
    .setDescription('Enterprise RWA Tokenization Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('organizations', 'Organization management')
    .addTag('assets', 'Asset management')
    .addTag('compliance', 'Compliance and KYC/AML')
    .addTag('trading', 'Marketplace trading')
    .addTag('payments', 'Payment processing')
    .addTag('blockchain', 'Blockchain integration')
    .addTag('ai', 'AI services')
    .addTag('analytics', 'Analytics and reporting')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  logger.log(`🚀 AssetFlow API running on port ${port}`);
  logger.log(`📚 API Docs: http://localhost:${port}/api/docs`);
  logger.log(`📊 Health: http://localhost:${port}/health`);
}

bootstrap();

