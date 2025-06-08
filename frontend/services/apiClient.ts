import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { signOut } from 'next-auth/react';
import { ApiResponse, ErrorResponse, ValidationErrorResponse } from '@/types/common';

// Custom error classes for better error handling
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    public path: string,
    public requestId?: string,
    public errorCode?: string
  ) {
    super(error);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    statusCode: number,
    error: string,
    path: string,
    public validationErrors: string[],
    public fieldErrors?: Record<string, string[]>,
    requestId?: string,
    errorCode?: string
  ) {
    super(statusCode, error, path, requestId, errorCode);
    this.name = 'ValidationError';
  }
}

// Global error handler type
export type ErrorHandler = (error: ApiError | ValidationError) => void;

class ApiClient {
  private client: AxiosInstance;
  private globalErrorHandler: ErrorHandler | null = null;
  private accessToken: string | null = null;

  constructor() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const apiBasePath = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api/v1';
    const baseURL = `${apiUrl}${apiBasePath}`;

    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // Set a global error handler (for toast notifications, etc.)
  setGlobalErrorHandler(handler: ErrorHandler) {
    this.globalErrorHandler = handler;
  }

  // Set the access token (call this when user logs in)
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  // Get the current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      config => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => {
        // Extract data from successful responses (they're wrapped in ApiResponse)
        return response;
      },
      (error: AxiosError) => {
        const customError = this.handleAxiosError(error);
        
        // Call global error handler if set (unless it's a 401, which we handle specially)
        if (this.globalErrorHandler && customError.statusCode !== 401) {
          this.globalErrorHandler(customError);
        }

        // Handle 401 separately for auth redirects
        if (customError.statusCode === 401) {
          if (typeof window !== 'undefined') {
            // signOut({ callbackUrl: '/login' });
          }
        }

        return Promise.reject(customError);
      }
    );
  }

  private handleAxiosError(error: AxiosError): ApiError | ValidationError {
    if (error.response?.data) {
      const errorData = error.response.data as ErrorResponse | ValidationErrorResponse;
      
      // Handle validation errors
      if ('validationErrors' in errorData && errorData.validationErrors) {
        return new ValidationError(
          errorData.statusCode,
          errorData.error,
          errorData.path,
          errorData.validationErrors,
          (errorData as ValidationErrorResponse).fieldErrors,
          errorData.requestId,
          errorData.errorCode
        );
      }
      
      // Handle regular API errors
      return new ApiError(
        errorData.statusCode,
        errorData.error,
        errorData.path,
        errorData.requestId,
        errorData.errorCode
      );
    }
    
    // Handle network/timeout errors
    if (error.request) {
      return new ApiError(
        0,
        error.message || 'Network error occurred',
        error.config?.url || 'unknown',
      );
    }
    
    // Handle other errors
    return new ApiError(
      500,
      error.message || 'An unexpected error occurred',
      'unknown'
    );
  }

  // Wrapper methods that extract data and handle success responses
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      // Backend wraps responses in { success: true, data: T } format
      const result = (response.data as any)?.data || response.data as T;
      
      // Validate that we have a response
      if (result === undefined || result === null) {
        throw new ApiError(
          500,
          'Invalid response format: no data received',
          url
        );
      }
      
      return result;
    } catch (error) {
      // Re-throw API errors as-is, but wrap other errors
      if (error instanceof ApiError || error instanceof ValidationError) {
        throw error;
      }
      
      console.error('GET request failed:', { url, error });
      throw new ApiError(
        500,
        error instanceof Error ? error.message : 'Network request failed',
        url
      );
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      // Backend wraps responses in { success: true, data: T } format  
      const result = (response.data as any)?.data || response.data as T;
      
      // Validate that we have a response
      if (result === undefined || result === null) {
        throw new ApiError(
          500,
          'Invalid response format: no data received',
          url
        );
      }
      
      return result;
    } catch (error) {
      // Re-throw API errors as-is, but wrap other errors
      if (error instanceof ApiError || error instanceof ValidationError) {
        throw error;
      }
      
      console.error('POST request failed:', { url, data, error });
      throw new ApiError(
        500,
        error instanceof Error ? error.message : 'Network request failed',
        url
      );
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T; // Extract the actual data from ApiResponse wrapper
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data as T; // Extract the actual data from ApiResponse wrapper
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data as T; // Extract the actual data from ApiResponse wrapper
  }

  // Method to disable global error handling for specific calls
  async withoutGlobalErrorHandling() {
    const originalHandler = this.globalErrorHandler;
    this.globalErrorHandler = null;
    
    return {
      get: <T>(url: string, config?: AxiosRequestConfig) => {
        const promise = this.get<T>(url, config);
        promise.finally(() => {
          this.globalErrorHandler = originalHandler;
        });
        return promise;
      },
      post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
        const promise = this.post<T>(url, data, config);
        promise.finally(() => {
          this.globalErrorHandler = originalHandler;
        });
        return promise;
      },
      put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
        const promise = this.put<T>(url, data, config);
        promise.finally(() => {
          this.globalErrorHandler = originalHandler;
        });
        return promise;
      },
      patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
        const promise = this.patch<T>(url, data, config);
        promise.finally(() => {
          this.globalErrorHandler = originalHandler;
        });
        return promise;
      },
      delete: <T>(url: string, config?: AxiosRequestConfig) => {
        const promise = this.delete<T>(url, config);
        promise.finally(() => {
          this.globalErrorHandler = originalHandler;
        });
        return promise;
      },
    };
  }
}

export const apiClient = new ApiClient();
