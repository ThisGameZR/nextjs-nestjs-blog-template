"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionProvider } from "@/providers/SessionProvider";
import { ErrorHandlingProvider } from "@/providers/ErrorHandlingProvider";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <NextAuthSessionProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
            <ErrorHandlingProvider>
              {children}
              <Toaster
                position="top-right"
                expand={true}
                richColors
                closeButton
              />
            </ErrorHandlingProvider>
        </QueryClientProvider>
      </SessionProvider>
    </NextAuthSessionProvider>
  );
} 