# Midnight Pay Development Notes

## Development Workflow
1. **After any contract modifications, always run `npm run compile` to check for errors**
2. **Fix compilation errors before proceeding to next steps**
3. **Test circuits individually before building full API layer**
4. **Use incremental development: contract → test → api → test → ui**

## Current Project Structure
```
midnight-pay/
├── pay-contract/          # Compact smart contracts
├── pay-api/              # TypeScript API layer  
├── pay-ui/               # React frontend
└── CLAUDE.md             # This file
```

## Banking Features (V1)
1. **create_account** - ZK proof for PIN validation
2. **deposit** - Confidential smart contract for balance updates
3. **check_balance** - Private state management  
4. **verify_account** - Selective disclosure for verification
5. **withdraw** - Private balance validation and updates

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