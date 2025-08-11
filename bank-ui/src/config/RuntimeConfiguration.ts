import React, { createContext, useContext, useEffect, useState } from 'react';

export interface RuntimeConfig {
  readonly INDEXER_URI: string;
  readonly INDEXER_WS_URI: string;
  readonly PROOF_SERVER?: string;
  readonly PUBLIC_URL?: string;
  readonly LOGGING_LEVEL?: string;
  readonly NETWORK_ID?: string;
}

const defaultConfig: RuntimeConfig = {
  INDEXER_URI: 'http://127.0.0.1:8088/api/v1/graphql',
  INDEXER_WS_URI: 'ws://127.0.0.1:8088/api/v1/graphql/ws',
  PROOF_SERVER: 'http://127.0.0.1:6300',
  PUBLIC_URL: '/',
  LOGGING_LEVEL: 'info',
  NETWORK_ID: 'Undeployed',
};

const RuntimeConfigurationContext = createContext<RuntimeConfig>(defaultConfig);

export const useRuntimeConfiguration = (): RuntimeConfig => useContext(RuntimeConfigurationContext);

export const RuntimeConfigurationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cfg, setCfg] = useState<RuntimeConfig>(defaultConfig);

  useEffect(() => {
    void (async () => {
      try {
        const resp = await fetch('/config.json');
        if (resp.ok) {
          const json = await resp.json();
          setCfg({ ...defaultConfig, ...json });
        }
      } catch {
        setCfg(defaultConfig);
      }
    })();
  }, []);

  return React.createElement(RuntimeConfigurationContext.Provider, { value: cfg, children });
};


