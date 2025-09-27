# Midnight Pay Development Notes

## Development Workflow
1. **After any contract modifications, always run `npm run compile` to check for errors**
2. **Fix compilation errors before proceeding to next steps**
3. **Test circuits individually before building full API layer**
4. **Use incremental development: contract → test → api → test → ui**

## Current Project Structure
```
midnight-pay/
├── pay-merchant-contract/ # Merchant operations smart contract
├── pay-customer-contract/ # Customer operations smart contract (future)
├── pay-commons/          # Shared types and utilities
├── pay-api/              # TypeScript API layer
├── pay-ui/               # React frontend
└── CLAUDE.md             # This file
```

## Future pay-customer-contract Operations
1. **approve_subscription** - Customer authorizes subscription with spending limits
2. **pause_subscription** - Customer pauses their subscription temporarily
3. **cancel_subscription** - Customer permanently cancels subscription
4. **prove_spending_pattern** - ZK proof of spending without revealing amounts
5. **prove_subscription_status** - ZK proof of active subscriber status

## Payment Gateway Features (V1)
1. **register_merchant** - Merchant registration with tier tracking
2. **create_subscription** - Subscription with cryptographic spending limits
3. **process_subscription_payment** - Recurring payment processing with auto-pause
4. **prove_merchant_tier** - ZK proof of merchant verification level
5. **prove_subscription_count** - ZK proof of merchant transaction volume

## Key Patterns from Battleship /Users/norman/Development/midnight/midnight-seabattle
- **Witnesses**: Provide private data to circuits
- **Hash Commitments**: Prevent cheating/data tampering
- **Private State**: Store secrets locally, never on blockchain
- **ZK Proofs**: Validate without revealing sensitive data

## Contract Modularization Pattern (from Seabattle)
- **Separate Commons Module**: Create shared types, structs, and utility functions in separate .compact file
- **Import Commons**: Use `import ModuleName;` to access shared functionality
- **Keep Contracts Focused**: Each contract should handle specific domain logic
- **Export Shared Types**: Use `export` keyword for types/functions needed by other contracts

## Compilation Issues to Watch
- Import all required functions (public_key, etc.)
- Use correct Compact compiler syntax: `compact compile src/file.compact ./target`
- Check for unbound identifiers before building API layer
- Counter types get default initialization (don't initialize in constructor)

## Reference Documentation
- **Compact Language Reference**: `@CompactDocs/` directory
- **Battleship Examples**: `/Users/norman/Development/midnight/midnight-seabattle/`
- **GameCommons.compact**: Has utility functions like `public_key()`
- **Domain Separation**: Use padding like `pad(32, "midnight:bank:pk:")` for unique contexts

## Quick Fixes for Common Errors
- **"unbound identifier public_key"**: Define as pure circuit with domain separation
- **"invalid context for Counter"**: Don't initialize Counter in constructor, use default
- **Import errors**: Check CompactStandardLibrary imports vs custom functions