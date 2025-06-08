import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly logger: LoggerService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        // Get the current status code, defaulting to 200 if not set
        const statusCode = response.statusCode || 200;
        
        const apiResponse = {
          success: statusCode < 400,
          message: this.getMessageFromStatusCode(Number(statusCode)),
          data,
          timestamp: new Date().toISOString(),
          statusCode,
        };

        // Log successful responses in debug mode
        if (process.env.NODE_ENV !== 'production' && statusCode < 400) {
          this.logger.debug(`Successful response for ${request.method} ${request.url}`, 'Response Interceptor');
        }

        return apiResponse;
      }),
    );
  }

  private getMessageFromStatusCode(statusCode: number): string {
    const messages: Record<number, string> = {
      200: 'Success',
      201: 'Created successfully',
      204: 'No content',
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not found',
      409: 'Conflict',
      500: 'Internal server error',
    };

    return messages[statusCode] || 'Success';
  }
}
