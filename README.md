# Midnight Bank - Privacy-First Banking DApp

![Midnight Bank](bank-ui/assets/midnight_sky.png)

A zero-knowledge banking application built on [Midnight](https://midnight.network) demonstrating private transfers, encrypted balances, and selective disclosure.

## 🚀 Quick Start

```bash
# Install and build
npm install && npm run build

# Run locally (Recommended)
npm run bank-ui:local
```

Open http://localhost:5173 in Chrome with [Lace Wallet](https://docs.midnight.network/develop/tutorial/using/chrome-ext) set to "Undeployed" network.

## 🏦 Using the Application

The application runs on a local Midnight network and provides a complete banking experience with privacy-first principles.

To use Midnight Bank, you'll need:
- Chrome browser with [Midnight Lace Wallet](https://docs.midnight.network/develop/tutorial/using/chrome-ext) installed
- Lace Wallet configured for "Undeployed" network (local development mode)

## 💰 Features

### Core Banking
- **Account Creation**: Deploy your own private bank contract with customizable settings
- **Private Balances**: Account balances remain encrypted and private to the account holder
- **Secure Transactions**: Deposit/withdraw funds with PIN authentication and zero-knowledge proofs
- **Transaction History**: View your private transaction history with real-time updates

### Advanced Privacy Features
- **Authorization System**: Zelle-like transfer permissions between trusted contacts
- **Encrypted Transfers**: Send money with amounts hidden until claimed by recipients
- **Selective Disclosure**: Prove account status or balance thresholds for compliance
- **Multi-Account Support**: Single contract supporting multiple users efficiently

## 🏗️ Architecture

### Smart Contract (`bank-contract/`)
- **Compact language** smart contract with 12 circuits
- **Shared contract** architecture supporting multiple users
- **Encrypted balance** storage with PIN-based authentication
- **Zero-knowledge proofs** for all operations

### API Layer (`bank-api/`)
- **TypeScript API** with RxJS reactive state management
- **Private state provider** for local encrypted storage
- **Transaction handling** with comprehensive error recovery

### Frontend (`bank-ui/`)
- **React + Material-UI** with dark/light themes
- **Wallet integration** with Midnight Lace
- **Real-time updates** via reactive observables

## 🛠️ Development

```bash
# Development mode with hot reload
npm run dev:local

# Run tests
npm test

# Type checking
npm run typecheck

# Build all packages
npm run build
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run bank-ui:local` | Build and start UI (local network) |
| `npm run bank-ui:testnet` | Build and start UI (testnet) |
| `npm run dev:local` | Development mode with hot reload (local) |
| `npm run dev:testnet` | Development mode with hot reload (testnet) |
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run typecheck` | Type check all packages |

## 🔧 Configuration

Network configs are in `bank-ui/public/`:
- `config.local.json` - Local development
- `config.testnet.json` - Midnight testnet

## 🧪 Test

```bash
# Run all tests
npm test

# Run contract tests
cd bank-contract && npm test

# Run API tests  
cd bank-api && npm test

# Run UI tests
cd bank-ui && npm test
```

## 📚 Learn More

- [Midnight Documentation](https://docs.midnight.network)
- [Compact Language](https://docs.midnight.network/learn/compact)
- [Lace Wallet Setup](https://docs.midnight.network/develop/tutorial/using/chrome-ext)
- [Zero-Knowledge Proofs](https://en.wikipedia.org/wiki/Zero-knowledge_proof)

## 🤝 Contributing

We welcome contributions to Midnight Bank! Please read our contributing guidelines and submit pull requests for any improvements.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Midnight Network](https://midnight.network) for the privacy-preserving blockchain infrastructure
- [Input Output Global](https://iohk.io) for developing the Midnight ecosystem
- The zero-knowledge cryptography community for advancing privacy technology

---

*Built with ❤️ for financial privacy*