'use client';

import { SessionProvider } from 'next-auth/react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/clients/apollo';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApolloProvider client={apolloClient}>
        {children}
      </ApolloProvider>
    </SessionProvider>
  );
}