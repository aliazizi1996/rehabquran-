import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      gcTime: 1000 * 60 * 15,    // 15 minutes garbage collection
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      networkMode: 'offlineFirst', // Return cached data immediately on slow/unstable connection
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 1,
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
