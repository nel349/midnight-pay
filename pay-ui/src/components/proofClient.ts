import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
export const proofClient = (uri: string, _cb: (action: string) => void) => httpClientProofProvider(uri);


