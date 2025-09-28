import type { Logger } from 'pino';
import type { DAppConnectorAPI, DAppConnectorWalletAPI, ServiceUriConfig } from '@midnight-ntwrk/dapp-connector-api';
import { concatMap, filter, firstValueFrom, interval, map, of, take, tap, throwError, timeout, type Observable } from 'rxjs';
import semver from 'semver';

export type ConnectToWalletResult = { wallet: DAppConnectorWalletAPI; uris: ServiceUriConfig };

export const connectToWallet = (
  logger: Logger,
): Promise<ConnectToWalletResult> => {
  const COMPATIBLE_CONNECTOR_API_VERSION = '1.x';

  const obs = (interval(100).pipe(
    map((): DAppConnectorAPI | undefined => (window as any)?.midnight?.mnLace),
      tap((api) => logger.debug(`check_wallet_api: hasApi=${Boolean(api)}`)),
      filter((api): api is DAppConnectorAPI => !!api),
      concatMap((api) =>
        semver.satisfies(api.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION)
          ? of(api)
          : throwError(() => new Error(`Incompatible Midnight Lace API ${api.apiVersion}`)),
      ),
      take(1),
      timeout({ first: 1_000, with: () => throwError(() => new Error('Could not find Midnight Lace wallet')) }),
      concatMap(async (api) => ({ api, enabled: await api.isEnabled() })),
      timeout({ first: 5_000, with: () => throwError(() => new Error('Wallet connector API timeout')) }),
      concatMap(async ({ api }) => {
        const wallet = await api.enable();
        const uris = await api.serviceUriConfig();
        const result: ConnectToWalletResult = { wallet, uris };
        return result;
      }),
      tap(() => logger.info('lace_connected')),
  ) as unknown) as Observable<ConnectToWalletResult>;
  return firstValueFrom(obs);
};


