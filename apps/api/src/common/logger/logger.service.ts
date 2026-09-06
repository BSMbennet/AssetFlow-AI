import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
    transports: [new transports.Console()],
  });
  log(message: any, context?: string) { this.logger.info(message, { context }); }
  error(message: any, trace?: string, context?: string) { this.logger.error(message, { trace, context }); }
  warn(message: any, context?: string) { this.logger.warn(message, { context }); }
  debug(message: any, context?: string) { this.logger.debug(message, { context }); }
  verbose(message: any, context?: string) { this.logger.verbose(message, { context }); }
}
