import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  cacheDir: './.vite',
  server: {
    host: true,
  },
  build: {
    target: 'esnext',
    minify: false,
  },
  plugins: [
    react(),
    // Transform CJS (including workspace .cjs files) before wasm/top-level-await handling
    viteCommonjs({
      include: [
        '**/node_modules/**',
        '**/*.cjs',
        '**/*.cts',
      ],
    }),
    wasm(),
    topLevelAwait(),
  ],
  optimizeDeps: {
    include: [
      '@midnight-ntwrk/compact-runtime',
      '@midnight-bank/bank-contract',
      '@midnight-bank/bank-api',
    ],
    exclude: [
      // Avoid pre-bundling the wasm runtime to prevent TLA in esbuild
      '@midnight-ntwrk/onchain-runtime',
    ],
    esbuildOptions: {
      target: 'esnext',
      format: 'esm',
      supported: {
        'top-level-await': true,
      },
    },
  },
  worker: {
    format: 'es',
    plugins: () => [wasm(), topLevelAwait()],
  },
  define: {
    global: 'globalThis',
  },
});


