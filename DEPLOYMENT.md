# Deployment Guide

This guide explains how to deploy and run Midnight Bank on different networks.

## Prerequisites

1. **Midnight Lace Wallet**: Install the latest version from the Chrome Web Store
2. **tDUST Tokens**: Get test tokens from the [Midnight Faucet](https://midnight.network/test-faucet)
3. **Node.js**: Version 18 or higher
4. **Network Access**: Ensure you can access the target network endpoints

## Network Configurations

### Testnet Deployment

Testnet is the public test network for Midnight. Use this for testing with realistic network conditions.

**Configuration:**
- Network ID: `testnet`
- Node URL: `wss://testnet.midnight.network`
- Indexer: `https://indexer-api.testnet.midnight.network/api/v1/graphql`
- Proof Server: `https://proof-server.testnet.midnight.network`

**To deploy on testnet:**

```bash
# Build for testnet
npm run build:testnet

# Or run in development mode
npm run dev:testnet
```

**Wallet Setup:**
1. Open Midnight Lace Wallet
2. Go to Settings → Networks
3. Select "Testnet"
4. Get tDUST from the faucet
5. Deploy your bank contract

### Local Development

For local development with a standalone Midnight node.

**Configuration:**
- Network ID: `Undeployed`
- Node URL: `http://127.0.0.1:8080`
- Indexer: `http://localhost:8088/api/v1/graphql`
- Proof Server: `http://localhost:6300`

**To run locally:**

```bash
# Start local Midnight network
docker compose -f undeployed-compose.yml up

# In another terminal, build and run
npm run build:local
npm run bank-ui:local

# Or run in development mode
npm run dev:local
```

**Wallet Setup:**
1. Open Midnight Lace Wallet
2. Go to Settings → Networks
3. Add/Select "Undeployed" network
4. Use the local faucet or predefined test accounts

## Environment Variables

The application uses configuration files instead of environment variables:

- `config.json` - Active configuration (auto-generated)
- `config.testnet.json` - Testnet configuration
- `config.local.json` - Local development configuration

## Deployment Steps

### 1. Choose Your Target Network

```bash
# For testnet
npm run config:testnet

# For local development
npm run config:local
```

### 2. Build the Application

```bash
# Build for the configured network
npm run build

# Or build for specific network
npm run build:testnet  # or build:local
```

### 3. Deploy Contracts (if needed)

If you need to deploy new contracts:

```bash
cd bank-contract
npm run deploy  # This will deploy to the configured network
```

### 4. Start the Application

```bash
# Serve the built application
npm run bank-ui

# Or run in development mode
npm run dev:testnet  # or dev:local
```

## Troubleshooting

### Common Issues

1. **Network Connection Errors**
   - Verify network URLs in config.json
   - Check firewall/proxy settings
   - Ensure Midnight services are running

2. **Wallet Connection Issues**
   - Verify wallet is on correct network
   - Check wallet has sufficient tDUST
   - Try refreshing the page

3. **Contract Deployment Failures**
   - Ensure wallet has enough tDUST for gas
   - Verify contract compilation succeeded
   - Check network is accessible

4. **Transaction Failures**
   - Verify sufficient balance
   - Check transaction parameters
   - Ensure contract is properly deployed

### Network-Specific Issues

**Testnet:**
- Service outages: Check Midnight status page
- Rate limiting: Reduce request frequency
- Faucet limits: Wait for cooldown period

**Local:**
- Docker issues: Ensure Docker is running
- Port conflicts: Check ports 8080, 8088, 6300, 9944
- Container health: Check `docker compose logs`

## Configuration Reference

### config.json Structure

```json
{
  "LOGGING_LEVEL": "info",           // Log level: trace, debug, info, warn, error
  "NETWORK_ID": "testnet",           // Network identifier
  "PUBLIC_URL": "wss://...",         // Midnight node WebSocket URL
  "INDEXER_URI": "https://...",      // GraphQL indexer HTTP endpoint
  "INDEXER_WS_URI": "wss://...",     // GraphQL indexer WebSocket endpoint
  "PROOF_SERVER_URL": "https://..." // Proof server endpoint
}
```

### Network Endpoints

**Testnet:**
- Node: `wss://testnet.midnight.network`
- Indexer: `https://indexer-api.testnet.midnight.network/api/v1/graphql`
- Proof Server: `https://proof-server.testnet.midnight.network`

**Local:**
- Node: `http://127.0.0.1:8080`
- Indexer: `http://localhost:8088/api/v1/graphql`
- Proof Server: `http://localhost:6300`

## Security Considerations

1. **Private Keys**: Never commit private keys or mnemonics
2. **Network URLs**: Verify endpoints are legitimate
3. **Dependencies**: Keep Midnight packages updated
4. **HTTPS**: Use secure connections for production
5. **Wallet**: Only use official Midnight Lace Wallet

## Production Deployment

For production deployment (when mainnet is available):

1. Create `config.mainnet.json` with mainnet endpoints
2. Add production build scripts
3. Set up proper monitoring and logging
4. Implement proper error handling
5. Configure CDN and caching
6. Set up automated deployments
