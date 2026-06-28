'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from '../../infrastructure/auth/privy-config';

export default function PrivyAuthContext({ children }: { children: React.ReactNode }) {
  if (!privyConfig.appId || privyConfig.appId === 'dummy-id') {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={privyConfig.appId}
      config={privyConfig.config}
    >
      {children}
    </PrivyProvider>
  );
}
