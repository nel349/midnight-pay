# Bank UI Implementation Plan

## Implementation Status: **Phase 2 COMPLETE** ✅

## Tech choices ✅ IMPLEMENTED
- UI: React + Vite + MUI ✅
- Data/state: Direct RxJS observables (TanStack Query deferred)
- RxJS interop: Direct subscription to `bankAPI.state$` observables
- Local persistence: localStorage-based account storage ✅
- Logging: pino (env-controlled) ✅

## Local persistence ✅ IMPLEMENTED
- accounts: contract_address (unique), label?, created_at, last_used_at ✅
- sessions: PIN authentication with 10-minute timeout ✅
- Auto-touch account on access ✅

## Routes ✅ IMPLEMENTED
- `/accounts`: welcome + list saved accounts (local) ✅
- `/accounts/create`: create account (deploy + create in one step) ✅  
- `/account/:contract`: account view with balance and actions ✅

## Shared providers ✅ IMPLEMENTED
- `BankWalletProvider`: Lace wallet integration + auto-connect ✅
- `DeployedAccountProvider`: deploy/subscribe management ✅

---

## ✅ Phase 1: Onboarding COMPLETED

### Goals ✅ ACHIEVED
1) Connect Lace; set network id from config ✅
2) Create account (deploy + create_account + verify) in one click ✅
3) Persist account (address/label/timestamps) locally ✅
4) Navigate to `/account/:contract` ✅

### Deliverables ✅ IMPLEMENTED
- Local repo: accounts/sessions via localStorage ✅
- `DeployedAccountProvider` for deploy/subscribe ✅
- Pages: `AccountsHome.tsx`, `Onboarding.tsx` ✅
- Connect Lace button; network id init ✅
- Copy bank keys into dist on build ✅

### Data flow ✅ WORKING
- Direct RxJS subscriptions to `bankAPI.state$` ✅
- State updates via private state provider manual sync ✅
- Real-time balance and transaction updates ✅

### Acceptance ✅ VERIFIED
- Connect → create (deploy+create+verify) → navigate works end-to-end ✅
- Account visible in `/accounts` list (local) ✅
- PIN entered inline; session-based authentication ✅

---

## ✅ Phase 2: Account view & actions COMPLETED

### Implemented Features ✅
- **Masked balance panel**: Shows `***` by default for privacy ✅
- **"Show Balance" authentication**: Runs `authenticateBalanceAccess` with PIN ✅
- **Auto re-mask**: Balance hides after 10-minute timeout ✅
- **Actions**: deposit/withdraw/verify buttons implemented ✅
- **Real-time updates**: Direct `state$` subscription ✅
- **Proper formatting**: Balance displays as currency (e.g., "50.00") ✅

### Key Technical Achievement ✅
- **Fixed private state persistence**: Manual state sync after circuit execution
- **Contract address consistency**: Uses contract address as private state key
- **Battleship pattern**: Applied working private state management pattern

## ✅ Phase 3: Inter-Contract Transfers (COMPLETED)

### 3.1 Inter-Contract Transfers ✅
- **Send money to contract**: Transfer funds to another Midnight Bank contract
- **Recipient verification**: Validate target contract before transfer
- **Transfer privacy**: Amount and recipient remain confidential
- **Transfer authorization**: PIN-based confirmation for outgoing transfers

### 3.2 Selective Balance Disclosure 🆕  
- **Custom disclosure permissions**: Grant specific contracts limited access
- **Threshold verification**: Yes/No disclosure for minimum balance requirements
- **Exact amount disclosure**: Full balance reveal to authorized contracts
- **Time-limited access**: Disclosure permissions with expiration
- **Revocable permissions**: Account holder can revoke access anytime

### 3.3 Native Token (DUST) Support 🆕 (out of scope for now)
- **Contract Changes**:
  - Add `accepted_token` (Bytes<32>) in constructor or hardcode native token type.
  - Add `vault`: Map<Bytes<32>, CoinInfo> (or QualifiedCoinInfo) keyed by user_id.
  - Modify `deposit` circuit to accept a `CoinInfo` parameter and call `receive(coin)`.
  - Modify `withdraw` circuit to use `sendImmediate` and store the returned change.
  - Optional: Aggregate multiple deposits via `mergeCoin`/`mergeCoinImmediate`.
- **API/Wallet Changes**:
  - When calling deposit, pass a `CoinInfo` input. Wallet will select a user coin and attach it (or use `createZswapInput`).
  - On withdraw, no user input coin is needed; the contract spends from its vault.
  - Keep private balances as UX state, backed by real coins.

### Implementation Strategy:
- New circuits: `send_to_contract`, `create_disclosure_permission`, `verify_balance_threshold`
- Permission management in private state
- UI for managing disclosure permissions and inter-contract transfers

## 🚧 Phase 4: History views (FUTURE)
- Transaction history display from `transactionHistoryHex$` + `transactionCount`
- Detailed client-side history with filters/totals
- CSV/JSON export functionality
- Transaction details and timestamps

## 🚧 Phase 5: Backup/restore (FUTURE) 
- Encrypt-and-export private state
- Import flow for account recovery
- Cross-device synchronization

---

## 🔧 Technical Notes

### Private State Management
- **Critical lesson**: Circuit witness calls don't automatically persist to private state provider
- **Solution**: Manual sync using `privateStateProvider.set()` + `privateStates$.next()`
- **Key insight**: Use contract address (not accountId) as consistent private state key

### Current Architecture  
- Direct RxJS observables (no TanStack Query)
- Manual private state synchronization after circuit transactions
- Session-based authentication with timeouts
- localStorage for account persistence

---

## 🚀 Future Optimizations

### Reduce Wallet Approvals
- Pre-deploy contracts to eliminate deployment transaction
- Combine `create_account` + `verify_account_status` into single circuit
- Single-transaction onboarding experience

### Enhanced UX
- Better error handling and user feedback
- Loading states and progress indicators  
- Offline support and state persistence
- Account backup/restore workflows