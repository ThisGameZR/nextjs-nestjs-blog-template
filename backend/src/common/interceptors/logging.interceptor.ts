import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../logging/logger.service';
import { LOG_ACTION_KEY, LogActionOptions } from '../decorators/log-action.decorator';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, headers, body, query, params } = request;

    // Get request info
    const userAgent = headers['user-agent'];
    const ip = request.ip || request.connection.remoteAddress;
    const contentLength = headers['content-length'];

    // Start timing
    const startTime = Date.now();

    // Log incoming request
    this.logger.logRequest(method, url, userAgent, ip);

    // Check for LogAction decorator
    const logActionOptions = this.reflector.getAllAndOverride<LogActionOptions>(LOG_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Log request details in debug mode
    if (process.env.NODE_ENV !== 'production') {
      const requestDetails = {
        method,
        url,
        query,
        params,
        body: this.sanitizeBody(body),
        contentLength,
        userAgent,
        ip,
      };
      this.logger.debug(`Request Details: ${JSON.stringify(requestDetails, null, 2)}`, 'HTTP Request');
    }

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log response
        this.logger.logResponse(method, url, Number(statusCode), responseTime);

        // Log user action if decorator is present
        if (logActionOptions && request.user) {
          const userId = (request.user as any).id || (request.user as any).sub || 'unknown';
          const actionDetails: any = {};

          if (logActionOptions.includeBody) actionDetails.body = this.sanitizeBody(body);
          if (logActionOptions.includeParams) actionDetails.params = params;
          if (logActionOptions.includeQuery) actionDetails.query = query;

          this.logger.logUserAction(String(userId), logActionOptions.action, actionDetails);
        }

        // Log response details in debug mode
        if (process.env.NODE_ENV !== 'production') {
          const responseDetails = {
            statusCode,
            responseTime: `${responseTime}ms`,
            dataSize: data ? JSON.stringify(data).length : 0,
          };
          this.logger.debug(`Response Details: ${JSON.stringify(responseDetails, null, 2)}`, 'HTTP Response');
        }
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log error response
        this.logger.logResponse(method, url, Number(statusCode), responseTime);
        this.logger.logError(error, 'HTTP Error', {
          method,
          url,
          statusCode,
          responseTime: `${responseTime}ms`,
          userAgent,
          ip,
        });

        throw error;
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
