'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/services/apiClient';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (session?.access_token) {
      // Set the token in the API client when session is available
      console.log('🔑 Setting API client token from session');
      apiClient.setAccessToken(session.access_token);
    } else {
      // Clear the token when no session (logged out or unauthenticated)
      console.log('🔑 Clearing API client token - no session');
      apiClient.setAccessToken(null);
    }
  }, [session, status]);

  // Also listen for beforeunload to clear token on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!session?.access_token) {
        apiClient.setAccessToken(null);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session]);

  return <>{children}</>;
} 