import { Buffer } from 'buffer';
// Provide Buffer polyfill for browser envs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Buffer = Buffer;


