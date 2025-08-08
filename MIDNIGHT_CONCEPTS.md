# Midnight Bank: Implementation of Core Midnight Concepts

This document explains how the Midnight Bank project demonstrates and implements the 4 core concepts of Midnight Network.

## Overview

Midnight Bank is a privacy-preserving banking DApp that showcases all four fundamental features of Midnight Network through a simple banking interface. The project demonstrates how zero-knowledge proofs can enable financial privacy while maintaining regulatory compliance through selective disclosure.

## The 4 Core Midnight Concepts

**PROVE • HIDE • COMPUTE • REVEAL**

### 1. Zero-Knowledge Proofs (ZK Proofs) - **PROVE**
**Concept**: Prove statements are true without revealing the underlying data.

**Implementation in Bank Contract**:
- **PIN Authentication**: Users prove they know their PIN without revealing it
  ```compact
  // In create_account and other circuits
  const expected_owner = public_key(pin);
  assert (account_owner.value == expected_owner, "Authentication failed");
  ```
- **Balance Validation**: Prove sufficient funds exist without revealing exact balance
  ```compact
  // In withdraw circuit
  const current_balance = account_balance();
  assert (current_balance >= amount, "Insufficient funds");
  ```
- **PIN Format Validation**: Prove PIN meets requirements without exposing PIN
  ```compact
  assert (valid_pin_format(initial_pin), "PIN must be valid format");
  ```

**Real-world Benefit**: Users can authenticate and perform transactions without exposing sensitive credentials or exact balance amounts to the public blockchain.

### 2. Private State Management - **HIDE**
**Concept**: Store sensitive data locally, never on the public blockchain.

**Implementation in Bank Contract**:
- **Private Balance**: Account balance stored only in local private state
  ```typescript
  export type BankPrivateState = {
    readonly accountPinHash: Uint8Array;         // Hashed PIN for authentication
    readonly accountBalance: bigint;             // Current balance (secret!)
    readonly transactionHistory: Uint8Array[];  // Array of transaction hashes (private, max 10)
  };
  ```
- **Witness Functions**: Provide private data to circuits when needed
  ```typescript
  account_balance: ({ privateState }): [BankPrivateState, bigint] => [
    privateState,
    privateState.accountBalance  // Never exposed publicly
  ]
  ```
- **Transaction History**: Complete transaction log kept private
  ```compact
  witness transaction_history(): Vector<10, Bytes<32>>;
  ```

**Real-world Benefit**: Account holders maintain complete financial privacy - balances and transaction details never appear on the public ledger.

### 3. Confidential Smart Contracts - **COMPUTE**
**Concept**: Execute complex business logic privately while maintaining public verifiability.

**Implementation in Bank Contract**:
- **Private Balance Updates**: All balance calculations happen confidentially
  ```compact
  // In deposit circuit - private computation
  const current_balance = account_balance();
  const new_balance = current_balance + amount;
  set_account_balance(new_balance as Uint<64>);
  ```
- **Private Transaction Processing**: Deposits and withdrawals processed without revealing amounts
  ```compact
  // In withdraw circuit
  const current_balance = account_balance();
  assert (current_balance >= amount, "Insufficient funds");
  const new_balance = current_balance - amount;
  set_account_balance(new_balance as Uint<64>);
  ```
- **Business Rule Enforcement**: Minimum deposits, balance requirements enforced privately
  ```compact
  assert (deposit_amount >= 10 as Uint<64>, "Minimum deposit is 10 coins");
  assert (balance >= 5 as Uint<64>, "Account balance too low for verification");
  ```

**Real-world Benefit**: Complex financial operations (balance checks, transfers, compliance rules) execute privately while remaining cryptographically verifiable.

### 4. Selective Disclosure - **REVEAL**
**Concept**: Reveal only necessary information for specific purposes while keeping everything else private.

**Implementation in Bank Contract**:
- **Account Verification**: Prove account is valid without revealing balance
  ```compact
  export circuit verify_account_status(pin: Bytes<32>): [] {
    // Authenticate user
    const expected_owner = public_key(pin);
    assert (account_owner.value == expected_owner, "Authentication failed");
    
    // Prove account meets requirements without revealing exact balance
    const balance = account_balance();
    assert (balance >= 5 as Uint<64>, "Account balance too low for verification");
    assert (transaction_count >= 1, "Insufficient transaction history");
    
    // Only reveal verification status
    account_status = disclose(pad(32, "verified"));
  }
  ```
- **Public Metadata Only**: Only transaction count and status disclosed publicly
  ```compact
  export ledger account_exists: Boolean;              // Whether account is created
  export ledger account_owner: Maybe<Bytes<32>>;      // Hash of account owner (for authentication)
  export ledger last_transaction: Bytes<32>;          // Hash of last transaction (no details revealed)
  export ledger transaction_count: Counter;           // Number of transactions (for activity proof)
  export ledger account_status: Bytes<32>;           // Account status hash (for verification)
  ```
- **Compliance-Ready**: Account holders can prove financial standing for loans, verification, etc. without revealing exact amounts

**Real-world Benefit**: Users can prove their creditworthiness, account validity, or transaction history to third parties (banks, regulators, lenders) without exposing sensitive financial details.

## Public vs Private Data Architecture

### Public Ledger (Visible on Blockchain)
```compact
export ledger account_exists: Boolean;              // Account creation status
export ledger account_owner: Maybe<Bytes<32>>;      // Hashed owner identity
export ledger last_transaction: Bytes<32>;          // Transaction hash (no amounts)
export ledger transaction_count: Counter;           // Activity level
export ledger account_status: Bytes<32>;           // Verification status
```

### Private State (Local Only)
```typescript
export type BankPrivateState = {
  readonly accountPinHash: Uint8Array;         // Authentication secret
  readonly accountBalance: bigint;             // Actual balance (never public)
  readonly transactionHistory: Uint8Array[];  // Complete transaction log
};
```

## Circuit Architecture

### Banking Operations as ZK Circuits
1. **`create_account`** - Account creation with ZK PIN validation
2. **`deposit`** - Private balance updates with authentication
3. **`authenticate_balance_access`** - Zero-knowledge balance access control
4. **`verify_account_status`** - Selective disclosure for compliance
5. **`withdraw`** - Private fund removal with balance validation

Each circuit demonstrates multiple Midnight concepts working together:
- ZK proofs for authentication
- Private state for sensitive data
- Confidential processing for business logic
- Selective disclosure for compliance

## Privacy Guarantees

### What Remains Private Forever
- ✅ Actual account balance amounts
- ✅ PIN/authentication credentials  
- ✅ Transaction amounts (deposit/withdrawal values)
- ✅ Complete transaction history with details
- ✅ Account holder personal information

### What Can Be Selectively Disclosed
- ✅ Account existence and validity
- ✅ Account activity level (transaction count)
- ✅ Verification status for compliance
- ✅ Proof of sufficient funds (without revealing amount)
- ✅ Proof of transaction history (without revealing details)

### What's Always Public
- ✅ Transaction hashes (no details revealed)
- ✅ Account owner hash (for authentication)
- ✅ Account status changes
- ✅ Smart contract execution proofs

## Real-World Applications

This pattern enables:

1. **Privacy-Preserving Banking**: Full financial privacy with regulatory compliance
2. **Confidential DeFi**: Private lending, trading, yield farming
3. **Corporate Finance**: Private business transactions with selective audit trails
4. **Cross-Border Payments**: Private international transfers with compliance reporting
5. **Credit Scoring**: Prove creditworthiness without revealing financial details

## Development Pattern

The Midnight Bank follows this development pattern that can be replicated:

1. **Define Private State**: What data should never be public?
2. **Design Witness Functions**: How to securely provide private data to circuits?
3. **Implement ZK Circuits**: What business logic needs privacy?
4. **Enable Selective Disclosure**: What information might need to be proven to third parties?
5. **Test Privacy Properties**: Verify no sensitive data leaks to public ledger

This architecture provides a complete template for building privacy-first financial applications on Midnight Network.

## The Midnight Framework: PROVE • HIDE • COMPUTE • REVEAL

Remember the 4 core concepts with these action words:

- **PROVE** 🔐 - Use Zero-Knowledge Proofs to authenticate and validate without exposing secrets
- **HIDE** 🙈 - Keep sensitive data in Private State, never on the public blockchain  
- **COMPUTE** ⚙️ - Execute business logic confidentially in smart contracts
- **REVEAL** 👁️ - Selectively disclose only what's needed for compliance and verification

Together, these concepts enable **"Privacy by Design"** - where privacy isn't an afterthought, but the foundation of the entire system.

  These action words make it easy to remember what each concept does:
  - PROVE things without revealing secrets
  - HIDE sensitive data from public view
  - COMPUTE business logic privately
  - REVEAL only what's necessary

  C - Compute
  P - Prove
  H - Hide
  R - Reveal