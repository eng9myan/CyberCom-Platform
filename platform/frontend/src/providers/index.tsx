"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth";
import { PreferencesProvider } from "@/contexts/preferences";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              const apiError = error as { status?: number };
              if (apiError?.status === 401 || apiError?.status === 403) return false;
              return failureCount < 3;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>{children}</PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
