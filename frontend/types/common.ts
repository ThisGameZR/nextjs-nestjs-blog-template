// API Response wrapper that matches backend ApiResponseDto<T>
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

// Error response that matches backend ErrorResponseDto
export interface ErrorResponse {
  success: boolean;
  message: string;
  error: string;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId?: string;
  errorCode?: string;
}

// Validation error response that matches backend ValidationErrorDto
export interface ValidationErrorResponse extends ErrorResponse {
  validationErrors: string[];
  fieldErrors?: Record<string, string[]>;
}

// Pagination structure that matches backend PaginatedResponseDto
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Query parameters for pagination that matches backend BaseQueryDto
export interface BaseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
