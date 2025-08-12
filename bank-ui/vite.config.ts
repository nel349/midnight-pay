import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  cacheDir: './.vite',
  server: {
    host: true,
    fs: {
      // Allow serving UI root as well as local workspace lib paths
      allow: [
        '/Users/norman/Development/midnight/midnight-bank/bank-ui',
        '/Users/norman/Development/midnight/midnight-bank/bank-api/dist',
        '/Users/norman/Development/midnight/midnight-bank/bank-api/src',
      ],
    },
  },
  build: {
    target: 'esnext',
    minify: false,
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@midnight-bank/bank-api': '/Users/norman/Development/midnight/midnight-bank/bank-api/dist',
    },
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
    ],
    exclude: [
      // Avoid pre-bundling the wasm runtime to prevent TLA in esbuild
      '@midnight-ntwrk/onchain-runtime',
      // Treat local workspace lib as source so dev picks up changes
      '@midnight-bank/bank-api',
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


