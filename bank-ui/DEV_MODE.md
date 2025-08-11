### Bank UI Dev Mode Setup

This doc explains how to run `bank-ui` in Vite dev mode and how we fixed the prior issues so others can work in dev without full builds.

## Quick start

1) Install deps once at the workspace root:

```
cd /Users/norman/Development/midnight/midnight-bank
npm i
```

2) Start the UI in dev mode:

```
cd /Users/norman/Development/midnight/midnight-bank/bank-ui
npm run dev
```

This runs a small prepare step before Vite, copying the ZK artifacts into `public/` so the dev server can serve them.

## What the dev script does

- `npm run dev` runs `dev:prepare` and then starts Vite:
  - `dev:prepare` copies contract artifacts into the dev server’s static folder:
    - Copies `../bank-contract/src/managed/bank/keys/*` → `public/keys/`
    - Copies `../bank-contract/src/managed/bank/zkir/*` → `public/zkir/`
- Then it starts Vite with `--host` so it’s accessible on your LAN if needed.

Note: dev mode does NOT require running the Compact compiler. The artifacts are already generated under `bank-contract/src/managed/bank/`.

## Vite configuration highlights (why it was broken before)

- Top-level-await and WASM are enabled via plugins and settings.
- We avoid pre-bundling `@midnight-ntwrk/onchain-runtime` because it contains WASM with top-level await that breaks when esbuild tries to `require(...)` it.
- CommonJS transform runs before WASM/TLA plugins and is configured to include `**/*.cjs` to handle contract outputs in dev.

These changes prevent errors like:
- “This require call is not allowed because … contains a top-level await”
- “does not provide an export named 'default'” when importing the CJS contract module.

## Troubleshooting

- Error: “Invalid input data for … VerifierKey … version … maximum supported … Unsupported version.”
  - Cause: The dev server is serving HTML/404 instead of binary verifier keys.
  - Fix: Ensure `public/keys/*.verifier` and `public/zkir/*.bzkir` exist. Run:
    - `npm run dev:prepare`
    - Hard refresh the browser (Cmd+Shift+R)
  - Verify in browser that these return 200 and binary:
    - `/keys/create_account.verifier`
    - `/keys/deposit.verifier`
    - `/zkir/create_account.bzkir`

- Error: “This require call is not allowed because … top-level await”
  - Fix: Use the Vite config checked into `bank-ui/vite.config.ts`. If you changed it locally, restore plugin order and keep `@midnight-ntwrk/onchain-runtime` excluded from optimizeDeps.
  - If the error persists, clear Vite cache and restart:
    - `rm -rf /Users/norman/Development/midnight/midnight-bank/bank-ui/.vite`

- Error: “does not provide an export named 'default' (index.cjs?import)”
  - The contract package has been adjusted to avoid default-importing the CJS file in dev. Pull latest and restart dev.

- 404 for `/favicon.ico`
  - Harmless; optional to add a favicon in `public/`.

## Notes

- Node 18+ recommended; Node 20 tested.
- Vite chooses a free port if 5173 is taken. Check terminal output for the URL.
- If you edit or update `bank-contract/src/managed/bank/*`, run `npm run dev:prepare` again to refresh `public/` copies.

## One-liners

- Start dev server from workspace root:
```
npm run -w @midnight-bank/bank-ui dev
```

- Re-copy ZK artifacts without restarting Vite:
```
cd /Users/norman/Development/midnight/midnight-bank/bank-ui && npm run dev:prepare
```


