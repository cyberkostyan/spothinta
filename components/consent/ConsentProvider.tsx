'use client';

import { createContext, useContext, useState, useCallback, useSyncExternalStore, ReactNode } from 'react';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/lib/consent';

interface ConsentContextType {
  analyticsEnabled: boolean;
  setAnalyticsEnabled: (enabled: boolean) => void;
  isLoaded: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

interface ConsentProviderProps {
  children: ReactNode;
}

const emptySubscribe = () => () => {};

export function ConsentProvider({ children }: ConsentProviderProps) {
  // Consent cookie is read as an external store; the server snapshot is false
  // and isLoaded flips to true once the client snapshot takes over.
  const storedConsent = useSyncExternalStore(emptySubscribe, getAnalyticsConsent, () => false);
  const isLoaded = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [override, setOverride] = useState<boolean | null>(null);

  const analyticsEnabled = override ?? storedConsent;

  const setAnalyticsEnabled = useCallback((enabled: boolean) => {
    setAnalyticsConsent(enabled);
    setOverride(enabled);
  }, []);

  return (
    <ConsentContext.Provider
      value={{
        analyticsEnabled,
        setAnalyticsEnabled,
        isLoaded,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextType {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}
