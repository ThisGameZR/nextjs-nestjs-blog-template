import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'The response data (if any)',
    example: null,
  })
  data?: T;

  @ApiPropertyOptional({
    description: 'Error message (only present when success is false)',
    example: null,
  })
  error?: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
    enum: [200, 201, 204, 400, 401, 403, 404, 409, 422, 500],
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Request ID for tracking purposes',
    example: 'req_1234567890abcdef',
  })
  requestId?: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was successful (always false for errors)',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'An error occurred while processing your request',
  })
  message: string;

  @ApiProperty({
    description: 'Detailed error information',
    example: 'User with email john@example.com already exists',
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
    enum: [400, 401, 403, 404, 409, 422, 429, 500, 503],
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  timestamp: string;

  @ApiProperty({
    description: 'The API endpoint that generated the error',
    example: '/api/v1/users',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Request ID for error tracking',
    example: 'req_1234567890abcdef',
  })
  requestId?: string;

  @ApiPropertyOptional({
    description: 'Error code for programmatic handling',
    example: 'USER_ALREADY_EXISTS',
  })
  errorCode?: string;
}

export class ValidationErrorDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Array of validation error messages',
    example: [
      'username must be longer than or equal to 3 characters',
    ],
    type: [String],
  })
  validationErrors: string[];

  @ApiPropertyOptional({
    description: 'Field-specific validation errors',
    example: {
      username: ['must be longer than or equal to 3 characters'],
    },
  })
  fieldErrors?: Record<string, string[]>;
}
