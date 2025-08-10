export const randomBytes = (size: number): Uint8Array => {
  const out = new Uint8Array(size);
  // Prefer Web Crypto in browsers
  const webCrypto: any = (globalThis as any)?.crypto;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(out);
    return out;
  }
  // Fallback (non-cryptographic) for non-browser contexts where node:crypto is unavailable in bundlers
  for (let i = 0; i < size; i++) {
    out[i] = Math.floor(Math.random() * 256);
  }
  return out;
};

export const pad = (s: string, n: number): Uint8Array => {
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(s);
  if (n < utf8Bytes.length) {
    throw new Error(`The padded length n must be at least ${utf8Bytes.length}`);
  }
  const paddedArray = new Uint8Array(n);
  paddedArray.set(utf8Bytes);
  return paddedArray;
};

export const formatBalance = (balance: bigint): string => {
  return (Number(balance) / 100).toFixed(2);
};

export const parseAmount = (amount: string): bigint => {
  return BigInt(Math.floor(parseFloat(amount) * 100));
};