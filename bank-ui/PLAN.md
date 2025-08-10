# Bank UI Implementation Plan

This plan mirrors the Battleship UI where useful and replaces ad-hoc subscriptions with TanStack Query. Phase 1 focuses on onboarding.

## Tech choices
- UI: React + Vite + MUI
- Data/state: TanStack Query (react-query) for queries/mutations, retries, cache
- RxJS interop: minimal adapter to sync `state$` → Query Cache; use `firstValueFrom` for milestone waits
- Local DB (browser): Drizzle ORM + sql.js (SQLite in WASM)
  - Alt: Dexie (IndexedDB) if preferred
- Logging: pino (env-controlled)

## Local DB schema
- `accounts`: id (pk), contract_address (unique), label?, created_at, last_used_at
- `recent_contracts`: contract_address (pk), seen_at
- `sessions`: contract_address (pk), last_auth_at
- `tx_detailed`: id (pk), contract_address (idx), type ('create'|'auth'|'deposit'|'withdraw'|'verify'), amount?, balance_after, timestamp

## Routes
- `/accounts`: list saved accounts + recent
- `/accounts/onboard`: onboarding wizard (deploy + create)
- `/account/:contract`: account view

## Shared providers
- `BankWalletProvider` (clone of battleship’s, bank zk-config)
- `BrowserDeployedAccountManager` (deploy/subscribe; persist to DB)

---

## Phase 1: Onboarding (now)

### Goals
1) Deploy contract; persist mapping locally
2) Prompt PIN + initial deposit (modal)
3) Call `createAccount` then `verifyAccountStatus`
4) Persist to `accounts` and `recent_contracts`
5) Navigate to `/account/:contract`

### Deliverables
- DB bootstrap (Drizzle + sql.js): `db/index.ts`, `db/schema.ts`, `db/repo.ts`, `hooks/useDB.ts`
- `BrowserDeployedAccountManager`
- Pages: `AccountsHome.tsx`, `Onboarding.tsx`
- `PinPromptDialog.tsx` (10‑min session policy recorded in `sessions`)
- React Query mutations: deploy/create/verify; queries: list accounts/recent

### Data flow
- Mutations for tx flows; progress and error states
- Wait readiness via `firstValueFrom(api.state$.pipe(filter(...)))`
- Optionally mirror detailed tx entries to `tx_detailed` after each action

### Acceptance
- Deploy → create → verify → navigate works end-to-end
- Account visible in `/accounts` and recent
- PIN via modal; no raw PIN stored (only session timestamp)

---

## Phase 2: Account view & actions
- Masked balance panel; “Show balance” runs `authenticateBalanceAccess` and updates `sessions.last_auth_at`; auto re-mask after 10 min
- Actions: deposit/withdraw/verify via mutations; DB updates; history appended
- RxJS adapter keeps `state$` in Query Cache per account

## Phase 3: History views
- On-chain metadata: `transactionHistoryHex$` + `transactionCount`
- Client-side detailed: `tx_detailed` queries; filters/totals; CSV/JSON export

## Phase 4: Backup/restore (optional)
- Encrypt-and-export DB + private state; import flow

## Notes on subscriptions
- Prefer Query as primary source; one adapter per account to sync `state$`; avoid scattered subscriptions
