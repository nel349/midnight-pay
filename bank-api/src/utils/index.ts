import * as crypto from 'node:crypto';

export const randomBytes = (size: number): Uint8Array => crypto.getRandomValues(Buffer.alloc(size));

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