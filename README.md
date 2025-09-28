# Midnight Pay - Privacy-First Payment Gateway

![Midnight Pay](bank-ui/assets/midnight_sky.png)

A zero-knowledge payment gateway built on [Midnight](https://midnight.network) demonstrating private transactions, encrypted payment details, and selective disclosure for merchants and customers.

## 🚀 Quick Start

```bash
# Install and build
npm install && npm run build

# Run locally (Recommended)
npm run pay-ui:local
```

Open http://localhost:5173 in Chrome with [Lace Wallet](https://docs.midnight.network/develop/tutorial/using/chrome-ext) set to "Undeployed" network.

## 💳 Using the Application

The application runs on a local Midnight network and provides a complete payment gateway experience with privacy-first principles.

To use Midnight Pay, you'll need:
- Chrome browser with [Midnight Lace Wallet](https://docs.midnight.network/develop/tutorial/using/chrome-ext) installed
- Lace Wallet configured for "Undeployed" network (local development mode)

## 💰 Features

### Core Features
- **Merchant Registration**: Merchants can register their businesses on the payment gateway
- **Subscription Management**: Customers can create, pause, resume, and cancel subscriptions for recurring payments
- **Private Transactions**: All payment details (amounts, recipients) remain encrypted and private
- **Secure Payments**: Process payments with zero-knowledge proofs for authenticity and privacy
- **Transaction History**: Merchants and customers can view their private transaction history with real-time updates

### Advanced Privacy Features
- **Customizable Payment Rules**: Merchants can define flexible payment terms and conditions
- **Encrypted Payment Details**: Payment amounts and recipient information are hidden until explicitly disclosed
- **Selective Disclosure**: Merchants can prove payment compliance or customer activity without revealing sensitive data
- **Multi-Merchant Support**: Single payment gateway contract supporting multiple merchants efficiently

## 🏗️ Architecture

### Smart Contract (`pay-contract/`)
- **Compact language** smart contract with 12 circuits
- **Payment gateway contract** architecture supporting multiple merchants and customers
- **Encrypted payment details** storage with zero-knowledge proofs
- **Zero-knowledge proofs** for all payment operations

### API Layer (`pay-api/`)
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
| `npm run pay-ui:local` | Build and start UI (local network) |
| `npm run pay-ui:testnet` | Build and start UI (testnet) |
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
cd pay-contract && npm test

# Run API tests  
cd pay-api && npm test

# Run UI tests
cd bank-ui && npm test
```

## 📚 Learn More

- [Midnight Documentation](https://docs.midnight.network)
- [Compact Language](https://docs.midnight.network/learn/compact)
- [Lace Wallet Setup](https://docs.midnight.network/develop/tutorial/using/chrome-ext)
- [Zero-Knowledge Proofs](https://en.wikipedia.org/wiki/Zero-knowledge_proof)

## 🤝 Contributing

We welcome contributions to Midnight Pay! Please read our contributing guidelines and submit pull requests for any improvements.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Midnight Network](https://midnight.network) for the privacy-preserving blockchain infrastructure for payments
- [Input Output Global](https://iohk.io) for developing the Midnight ecosystem
- The zero-knowledge cryptography community for advancing privacy technology

---

*Built with ❤️ for private and secure payments*