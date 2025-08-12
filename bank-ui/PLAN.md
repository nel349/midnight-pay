# Bank UI Implementation Plan

This plan mirrors the Battleship UI where useful and replaces ad-hoc subscriptions with TanStack Query. Phase 1 focuses on onboarding.

## Tech choices
- UI: React + Vite + MUI
- Data/state: TanStack Query (react-query) for queries/mutations, retries, cache (later)
- RxJS interop: minimal adapter to sync `state$` → Query Cache; use `firstValueFrom` for milestone waits
- Local persistence (Phase 1): simple localStorage repo abstraction (swap to Drizzle/sql.js later if needed)
- Logging: pino (env-controlled)

## Local persistence (Phase 1)
- accounts: contract_address (unique), label?, created_at, last_used_at
- sessions: contract_address, last_auth_at (for mask/unmask)
- recent: optional list of recently opened contracts
Note: implemented via localStorage behind a small repo; can be migrated to Drizzle/sql.js in Phase 3 if richer queries are needed.

## Routes
- `/accounts`: welcome + list saved accounts (local)
- `/accounts/create`: create account (deploy + create in one step)
- `/account/:contract`: account view

## Shared providers
- `BankWalletProvider` (clone of battleship’s, bank zk-config)
- `BrowserDeployedAccountManager` (deploy/subscribe; persist to DB)

---

## Phase 1: Onboarding (now)

### Goals
1) Connect Lace; set network id from config
2) Create account (deploy + create_account + verify) in one click
3) Persist account (address/label/timestamps) locally (localStorage repo)
4) Navigate to `/account/:contract`

### Deliverables
- Local repo: accounts/sessions via localStorage (swap-in later)
- `DeployedAccountProvider` for deploy/subscribe
- Pages: `AccountsHome.tsx`, `Onboarding.tsx`
- Connect Lace button; network id init
- Copy bank keys into dist on build

### Data flow
- Mutations for tx flows; progress and error states
- Wait readiness via `firstValueFrom(api.state$.pipe(filter(...)))`
- Optionally mirror detailed tx entries to `tx_detailed` after each action

### Acceptance
- Connect → create (deploy+create+verify) → navigate works end-to-end
- Account visible in `/accounts` list (local)
- PIN entered inline; no raw PIN stored (only session timestamp later)

---

## Phase 2: Account view & actions
- Masked balance panel; “Show balance” runs `authenticateBalanceAccess` and updates `sessions.last_auth_at`; auto re-mask after 10 min
- Actions: deposit/withdraw/verify via mutations; DB updates; history appended
- RxJS adapter keeps `state$` in Query Cache per account

## Phase 3: History views
- On-chain metadata: `transactionHistoryHex$` + `transactionCount`
- Client-side detailed: optional move to Drizzle/sql.js for filters/totals; CSV/JSON export

## Phase 4: Backup/restore (optional)
- Encrypt-and-export DB + private state; import flow

## Notes on subscriptions
- Prefer Query as primary source; one adapter per account to sync `state$`; avoid scattered subscriptions

---

## Optimizations

- Reduce approvals during onboarding
  - Pre-deploy `bank-contract` and use `BankAPI.subscribe(...)` with a configured `contractAddress` instead of `BankAPI.deploy(...)` on first run. This removes the deploy transaction (one approval).
  - Call only one circuit during onboarding. Today we do `create_account` then `verify_account_status` (two tx). Either skip verification at onboarding or add a combined circuit so onboarding sends one tx.

- Single-transaction onboarding (contract-level)
  - Add a new impure circuit, e.g. `create_and_verify(pin, initial_deposit)`, that performs the current create and verification logic within one circuit, producing a single tx/approval.
  - Recompile and export keys/zkir; update `bank-api` to call `callTx.create_and_verify(...)` in onboarding.