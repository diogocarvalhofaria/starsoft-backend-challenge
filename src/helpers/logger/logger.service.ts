import { Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { isAxiosError, AxiosError } from 'axios';
import { QueryFailedError } from 'typeorm';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  log(message: string): void {
    this.logger.info(message);
  }

  error(trace: unknown): void {
    if (trace instanceof QueryFailedError) {
      this.logger.error(`DATABASE ERROR: ${trace.message}`, {
        query: trace.query,
        parameters: trace.parameters,
      });
    } else if (isAxiosError(trace)) {
      const axiosError = trace as AxiosError;

      const method = axiosError.config?.method ?? 'unknown';
      const url = axiosError.config?.url ?? 'unknown';
      const responseData = axiosError.response?.data
        ? JSON.stringify(axiosError.response.data)
        : 'no response data';

      this.logger.error(`EXTERNAL API ERROR: ${axiosError.message}`, {
        method,
        url,
        response: responseData,
      });
    } else if (trace instanceof Error) {
      this.logger.error(trace.message, { stack: trace.stack });
    } else {
      this.logger.error(String(trace));
    }
  }

  warn(message: string): void {
    this.logger.warn(message);
  }
}
