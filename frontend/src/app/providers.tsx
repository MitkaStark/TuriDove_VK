'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(60 30% 98%)',
            color: 'hsl(150 10% 10%)',
            border: '1px solid hsl(60 15% 85%)',
          },
          success: {
            iconTheme: {
              primary: 'hsl(142 50% 28%)',
              secondary: 'hsl(60 30% 98%)',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
