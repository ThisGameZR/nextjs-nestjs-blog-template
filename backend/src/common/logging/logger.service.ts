import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService extends Logger {
  private isTestEnvironment: boolean;
  
  constructor(private readonly configService: ConfigService) {
    super('Application');
    this.isTestEnvironment = process.env.NODE_ENV === 'test';
  }

  log(message: string, context?: string) {
    if (!this.isTestEnvironment) {
      super.log(message, context);
    }
  }

  error(message: string, trace?: string, context?: string) {
    if (!this.isTestEnvironment) {
      super.error(message, trace, context);
    }
  }

  warn(message: string, context?: string) {
    if (!this.isTestEnvironment) {
      super.warn(message, context);
    }
  }

  debug(message: string, context?: string) {
    if (!this.isTestEnvironment) {
      super.debug(message, context);
    }
  }

  verbose(message: string, context?: string) {
    if (!this.isTestEnvironment) {
      super.verbose(message, context);
    }
  }

  logRequest(method: string, url: string, userAgent?: string, ip?: string) {
    if (!this.isTestEnvironment) {
      const message = `${method} ${url} - User-Agent: ${userAgent || 'N/A'} - IP: ${ip || 'N/A'}`;
      this.log(message, 'HTTP Request');
    }
  }

  logResponse(method: string, url: string, statusCode: number, responseTime: number) {
    if (!this.isTestEnvironment) {
      const message = `${method} ${url} - ${statusCode} - ${responseTime}ms`;
      this.log(message, 'HTTP Response');
    }
  }

  logError(error: any, context?: string, additionalInfo?: any) {
    if (!this.isTestEnvironment) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      const additionalInfoStr = additionalInfo ? `\nAdditional Info: ${JSON.stringify(additionalInfo, null, 2)}` : '';

      this.error(`${errorMessage}${additionalInfoStr}`, stack, context);
    }
  }

  logDatabaseQuery(query: string, parameters?: any[], executionTime?: number) {
    if (!this.isTestEnvironment) {
      const message = `Query: ${query}${parameters ? ` | Parameters: ${JSON.stringify(parameters)}` : ''}${executionTime ? ` | Execution Time: ${executionTime}ms` : ''}`;
      this.debug(message, 'Database');
    }
  }

  logUserAction(userId: string, action: string, details?: any) {
    if (!this.isTestEnvironment) {
      const message = `User ${userId} performed action: ${action}${details ? ` | Details: ${JSON.stringify(details)}` : ''}`;
      this.log(message, 'User Action');
    }
  }
}
