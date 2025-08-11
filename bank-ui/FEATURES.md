# Bank UI - Features & Roadmap

This document tracks the features for the Bank UI onboarding, account management, and history views. Use checkboxes to track implementation status.

## 1. Onboarding (Phase 1)
- [x] Project scaffold (Vite + React + MUI)
- [x] Vite config for WASM/top-level-await/commonjs
- [x] Dockerfile + Nginx runtime config
- [x] Onboarding page scaffold (deploy → create → verify)
- [ ] Wallet/provider context (BankWalletProvider)
- [ ] Local SQL DB bootstrap (Drizzle + sql.js)
- [ ] PIN prompt dialog (4–8 digits, validation)
- [ ] React-query mutations (deploy/create/verify)
- [ ] Persist account + recents in DB

## 2. Accounts Home
- [ ] List saved accounts
- [ ] Add existing account by address
- [ ] Mark recent; rename/label accounts

## 3. Account View (Phase 2)
- [ ] Masked balance (unmask on fresh session)
- [ ] Authenticate balance access (PIN; 10-min expiry)
- [ ] Deposit/Withdraw modals (PIN + amount)
- [ ] Verify account status (PIN)
- [ ] RxJS → Query Cache adapter for `state$`

## 4. History (Phase 3)
- [ ] On-chain metadata (transactionCount + transactionHistoryHex)
- [ ] Client-side detailed history (type, amount?, balanceAfter, timestamp)
- [ ] Filters; totals; export CSV/JSON

## 5. Local Database
- [ ] Schema: accounts, recent_contracts, sessions, tx_detailed
- [ ] Repository API (insert/list/update)
- [ ] Session policy (10-min expiry)
- [ ] Optional encryption hooks

## 6. Wallet & Providers
- [ ] Provider construction (indexer, zk-config, proof, wallet, midnight)
- [ ] Snackbars for proving/submission
- [ ] Public config ingestion (config.json)

## 7. Build & Dev Infra
- [x] Vite build (wasm bundles) + preview
- [x] Dev server guidance (optimizeDeps excludes)
- [x] Turbo build inputs updated for UI assets
- [ ] CI build job (optional)

## 8. Backup/Restore (Optional)
- [ ] Export encrypted DB + private state
- [ ] Import with passphrase

## 9. Observability
- [ ] Configurable log level (pino)
- [ ] Download client logs

## 10. Performance
- [ ] Query caching & invalidation strategy
- [ ] Code splitting to reduce bundle size
- [ ] Single subscription adapter per account

## 11. Documentation
- [x] Implementation Plan (PLAN.md)
- [ ] Usage guide (README)
- [ ] Architecture overview

