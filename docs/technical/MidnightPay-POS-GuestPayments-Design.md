# MidnightPay POS & Guest Payments Design Document

## Executive Summary

This document outlines future enhancements to MidnightPay for supporting Point-of-Sale (POS) systems and guest payments without requiring account creation. These features would enable broader adoption for physical retail, e-commerce, and one-time payment scenarios.

---

## Current System Limitations

### What We Have
- **Subscription-based payments only** (recurring, scheduled)
- **Account requirement** (customers must register and deposit funds)
- **Pre-funded model** (tokens must be deposited before spending)
- **B2B focus** (merchant-to-customer subscriptions)

### What's Missing for Broader Adoption
- **One-time payments** for retail/e-commerce
- **Guest checkout** without account creation
- **Variable amount payments** (not pre-set subscriptions)
- **Immediate settlement** for POS scenarios

---

## Proposed POS Payment Features

### 1. Direct Payment Circuit

**Purpose:** Enable immediate one-time payments between customers and merchants

```compact
export circuit process_direct_payment(
  customer_id: Bytes<32>,
  merchant_id: Bytes<32>,
  amount: Uint<64>,
  payment_reference: Bytes<32>
): Bytes<32>
```

**Key Features:**
- No subscription setup required
- Variable payment amounts
- Immediate processing
- Receipt generation
- Same fee structure as subscriptions

**Use Cases:**
- Online purchases
- In-store transactions
- Service payments
- Bill settlements

---

## Guest Payment Implementation Options

### Option 1: Ephemeral Accounts

**Concept:** Create temporary accounts for single transactions

```compact
export circuit process_guest_payment(
  merchant_id: Bytes<32>,
  amount: Uint<64>,
  guest_payment_token: Bytes<32>,
  payment_reference: Bytes<32>
): Bytes<32>
```

**Pros:**
- Uses existing infrastructure
- Simple implementation
- Privacy preserved

**Cons:**
- Requires pre-funding
- Extra step for users

**Best For:** Online checkouts where users can pre-fund

### Option 2: Payment Links/Invoices

**Concept:** Merchants create shareable payment requests

```compact
export circuit create_payment_invoice(
  merchant_id: Bytes<32>,
  amount: Uint<64>,
  expiry: Uint<32>
): Bytes<32>

export circuit pay_invoice(
  invoice_id: Bytes<32>,
  payment_proof: Bytes<32>
): []
```

**Pros:**
- Flexible and shareable
- No account needed
- Clear payment intent

**Cons:**
- More complex implementation
- Requires external verification

**Best For:** E-commerce, remote payments, invoicing

### Option 3: QR Code Payments

**Concept:** Generate QR codes for instant payment sessions

```compact
export circuit generate_payment_qr(
  merchant_id: Bytes<32>,
  amount: Uint<64>,
  description: Bytes<64>
): Bytes<32>

export circuit complete_qr_payment(
  session_id: Bytes<32>,
  payment_tx: Bytes<32>
): []
```

**Pros:**
- User-friendly
- Works with mobile wallets
- Perfect for physical POS

**Cons:**
- Requires wallet integration
- Session management complexity

**Best For:** Physical stores, markets, events

---

## Implementation Comparison Matrix

| Feature | Subscription (Current) | Direct Payment | Guest Payment | QR Payment |
|---------|----------------------|----------------|---------------|------------|
| Account Required | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| Pre-funding | ✅ Required | ✅ Required | ⚠️ Partial | ❌ Not needed |
| Setup Complexity | High | Low | Medium | Low |
| User Experience | B2B Focused | Good | Better | Best |
| Privacy Level | Maximum | Maximum | High | High |
| Transaction Speed | Scheduled | Instant | Instant | Instant |
| Receipt/Proof | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Fee Structure | Percentage | Percentage | Percentage | Percentage |

---

## Technical Requirements

### Core Components Needed

1. **Payment Session Management**
   - Session creation and expiry
   - Status tracking
   - Timeout handling

2. **External Payment Verification**
   - Proof validation
   - Transaction confirmation
   - Bridge to external chains

3. **Receipt Generation**
   - Cryptographic proofs
   - Verifiable receipts
   - Audit trail

4. **Guest Identity Handling**
   - Ephemeral IDs
   - Privacy preservation
   - No KYC requirements

### Data Structures

```compact
struct PaymentSession {
  merchant_id: Bytes<32>;
  amount: Uint<64>;
  description: Bytes<64>;
  created_at: Uint<32>;
  expires_at: Uint<32>;
  status: SESSION_STATUS;
}

struct PaymentInvoice {
  merchant_id: Bytes<32>;
  amount: Uint<64>;
  expiry: Uint<32>;
  status: INVOICE_STATUS;
  paid_by: Option<Bytes<32>>;
  paid_at: Option<Uint<32>>;
}

enum SESSION_STATUS {
  awaiting_payment,
  processing,
  completed,
  expired,
  cancelled
}
```

---

## Integration Considerations

### Wallet Integration
- MetaMask support
- WalletConnect compatibility
- Mobile wallet SDKs
- Hardware wallet support

### External Chain Bridges
- Ethereum payment verification
- Bitcoin Lightning Network
- Stablecoin settlements
- Cross-chain atomic swaps

### Merchant Tools
- Payment terminal apps
- QR code generators
- Invoice management
- Settlement reporting

---

## Implementation Roadmap

### Phase 1: Direct Payments (2-3 days)
- [ ] Add direct payment circuit
- [ ] Update fee calculations
- [ ] Add receipt generation
- [ ] Create test suite

### Phase 2: Payment Sessions (3-4 days)
- [ ] Implement session management
- [ ] Add QR code generation
- [ ] Create expiry handling
- [ ] Build session status tracking

### Phase 3: Guest Payments (4-5 days)
- [ ] Design ephemeral account system
- [ ] Implement payment verification
- [ ] Add guest payment circuits
- [ ] Create integration tests

### Phase 4: Wallet Integration (1 week)
- [ ] MetaMask connector
- [ ] Mobile wallet SDK
- [ ] Payment proof validation
- [ ] User experience optimization

---

## Security Considerations

### Risk Mitigation
- **Double spending**: Use unique payment tokens
- **Session hijacking**: Implement expiry and single-use tokens
- **Fee manipulation**: On-chain fee verification
- **Replay attacks**: Timestamp and nonce validation

### Privacy Preservation
- No KYC for guest payments
- Encrypted payment metadata
- Zero-knowledge receipt proofs
- Anonymous payment options

---

## Market Positioning

### Target Markets

1. **Crypto-Native Commerce**
   - NFT marketplaces
   - DeFi services
   - Web3 applications
   - DAO treasuries

2. **Privacy-Conscious Retail**
   - VPN services
   - Privacy tools
   - Sensitive products
   - Anonymous donations

3. **International Payments**
   - Cross-border transactions
   - Remittances
   - Freelance payments
   - Digital nomad services

### Competitive Advantages
- **Privacy by default**: Zero-knowledge proofs
- **Low fees**: Direct blockchain settlement
- **No intermediaries**: Peer-to-peer transactions
- **Programmable**: Smart contract flexibility
- **Censorship resistant**: Decentralized infrastructure

---

## Next Steps

1. **Complete Phase 2 API** for current subscription system
2. **Build demo UI** to showcase current capabilities
3. **Gather feedback** on POS requirements
4. **Prioritize features** based on market demand
5. **Implement incrementally** starting with direct payments

---

## Appendix: Code Examples

### Complete Direct Payment Implementation

```compact
// Direct payment for POS systems
export circuit process_pos_payment(
  customer_id: Bytes<32>,
  merchant_id: Bytes<32>,
  amount: Uint<64>,
  description: Bytes<64>,
  payment_reference: Bytes<32>
): Bytes<32> {
  // Verify merchant exists
  assert(merchant_accounts.member(disclose(merchant_id)), "Merchant not found");

  // Check customer balance
  const customer_balance = customer_balances.member(disclose(customer_id)) ?
    customer_balances.lookup(disclose(customer_id)) : 0 as Uint<64>;
  assert(TO_validate_balance(customer_balance, amount), "Insufficient balance");

  // Calculate fees
  const merchant_data = merchant_info(merchant_id);
  const fee_basis_points = PC_calculate_fee_basis_points(merchant_data.tier);
  const fee_amount = calculate_percentage_fee(amount, fee_basis_points);

  // Verify fee calculation
  const fee_valid = TO_verify_fee_calculation(amount, fee_basis_points, fee_amount);
  assert(fee_valid, "Invalid fee calculation");

  // Calculate net payment
  const net_amount = amount > fee_amount ? (amount - fee_amount) as Uint<64> : 0 as Uint<64>;

  // Get merchant balance
  const merchant_balance = merchant_balances.member(disclose(merchant_id)) ?
    merchant_balances.lookup(disclose(merchant_id)) : 0 as Uint<64>;

  // Process payment
  const customer_new_balance = TO_calculate_withdrawal(customer_balance, amount);
  const merchant_new_balance = TO_calculate_deposit(merchant_balance, net_amount);

  // Update balances
  customer_balances.insert(disclose(customer_id), disclose(customer_new_balance));
  merchant_balances.insert(disclose(merchant_id), disclose(merchant_new_balance));

  // Burn fee
  total_supply = disclose((total_supply - fee_amount) as Uint<64>);

  // Store payment record
  payment_records.insert(disclose(payment_reference), disclose(PC_PaymentRecord {
    customer_id: disclose(customer_id),
    merchant_id: disclose(merchant_id),
    amount: disclose(amount),
    fee: disclose(fee_amount),
    description: disclose(description),
    timestamp: current_timestamp,
    status: PC_PAYMENT_STATUS.completed
  }));

  // Update merchant statistics
  const updated_merchant = PC_MerchantInfo {
    merchant_id: merchant_data.merchant_id,
    business_name: merchant_data.business_name,
    tier: PC_calculate_merchant_tier((merchant_data.transaction_count + 1) as Uint<32>),
    transaction_count: (merchant_data.transaction_count + 1) as Uint<32>,
    total_volume: (merchant_data.total_volume + amount) as Uint<64>,
    created_at: merchant_data.created_at,
    is_active: merchant_data.is_active
  };
  set_merchant_info(merchant_id, updated_merchant);

  // Return payment reference as receipt
  return disclose(payment_reference);
}
```

---

**Document Status:** Draft v1.0
**Last Updated:** Current Session
**Author:** MidnightPay Development Team