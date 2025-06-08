'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { apiClient, ApiError, ValidationError } from '@/services/apiClient';

export type ErrorDisplayMode = 'toast' | 'silent' | 'custom';

interface ErrorHandlingContextType {
  setErrorMode: (mode: ErrorDisplayMode) => void;
  handleError: (error: ApiError | ValidationError, customHandler?: (error: ApiError | ValidationError) => void) => void;
}

const ErrorHandlingContext = createContext<ErrorHandlingContextType | null>(null);

interface ErrorHandlingProviderProps {
  children: ReactNode;
  defaultMode?: ErrorDisplayMode;
}

export function ErrorHandlingProvider({ 
  children, 
  defaultMode = 'toast' 
}: ErrorHandlingProviderProps) {
  let currentMode: ErrorDisplayMode = defaultMode;

  const handleError = (
    error: ApiError | ValidationError, 
    customHandler?: (error: ApiError | ValidationError) => void
  ) => {
    if (customHandler) {
      customHandler(error);
      return;
    }

    switch (currentMode) {
      case 'toast':
        showErrorToast(error);
        break;
      case 'silent':
        // Just log the error, don't show anything to user
        console.error('API Error:', error);
        break;
      case 'custom':
        // Do nothing - let the calling component handle it
        break;
    }
  };

  const setErrorMode = (mode: ErrorDisplayMode) => {
    currentMode = mode;
  };

  const showErrorToast = (error: ApiError | ValidationError) => {
    if (error instanceof ValidationError) {
      // For validation errors, show field-specific messages if available
      if (error.fieldErrors) {
        const fieldMessages = Object.entries(error.fieldErrors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        
        toast.error('Validation Error', {
          description: fieldMessages,
          duration: 5000,
        });
      } else if (error.validationErrors.length > 0) {
        toast.error('Validation Error', {
          description: error.validationErrors.join('\n'),
          duration: 5000,
        });
      } else {
        toast.error('Validation Error', {
          description: error.message,
          duration: 4000,
        });
      }
    } else {
      // Regular API errors
      const title = getErrorTitle(error.statusCode);
      toast.error(title, {
        description: error.message,
        duration: 4000,
      });
    }
  };

  const getErrorTitle = (statusCode: number): string => {
    switch (statusCode) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Validation Error';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  // Set up the global error handler when the provider mounts
  useEffect(() => {
    apiClient.setGlobalErrorHandler(handleError);
    
    // Cleanup function to remove the handler
    return () => {
      apiClient.setGlobalErrorHandler(() => {});
    };
  }, []);

  const contextValue: ErrorHandlingContextType = {
    setErrorMode,
    handleError,
  };

  return (
    <ErrorHandlingContext.Provider value={contextValue}>
      {children}
    </ErrorHandlingContext.Provider>
  );
}

export function useErrorHandling() {
  const context = useContext(ErrorHandlingContext);
  if (!context) {
    throw new Error('useErrorHandling must be used within an ErrorHandlingProvider');
  }
  return context;
}

// Hook for components that want to temporarily disable global error handling
export function useCustomErrorHandling() {
  const { setErrorMode } = useErrorHandling();
  
  const withCustomErrorHandling = async <T,>(
    apiCall: () => Promise<T>,
    customHandler: (error: ApiError | ValidationError) => void
  ): Promise<T | null> => {
    try {
      // Temporarily disable global error handling for this call
      const apiClientWithoutGlobal = await apiClient.withoutGlobalErrorHandling();
      return await apiCall();
    } catch (error) {
      if (error instanceof ApiError || error instanceof ValidationError) {
        customHandler(error);
      } else {
        // Re-throw unexpected errors
        throw error;
      }
      return null;
    }
  };

  const withSilentErrors = async <T,>(apiCall: () => Promise<T>): Promise<T | null> => {
    return withCustomErrorHandling(apiCall, (error) => {
      console.error('Silent API Error:', error);
    });
  };

  return {
    withCustomErrorHandling,
    withSilentErrors,
  };
} 