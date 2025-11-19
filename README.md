# Polygon Toolkit - Upgradeable ERC20 Token Deployment

A Hardhat-based project for deploying upgradeable ERC20 tokens on Polygon networks using the UUPS (Universal Upgradeable Proxy Standard) pattern. This project demonstrates senior-level smart contract engineering with upgradeable contracts, security controls, and comprehensive testing.

## 🪙 Token Information

- **Token Name**: Yaroslav
- **Symbol**: YARO
- **Total Supply**: 1,000,000 YARO (1,000,000,000,000,000,000,000,000 wei)
- **Decimals**: 18
- **Owner Balance**: 1,000,000 YARO (1,000,000,000,000,000,000,000,000 wei)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone git@github.com:YaroslavGuru/polygon-toolkit.git
cd polygon-toolkit
```

2. Install dependencies:
```bash
npm install
```

### Configuration

The project is configured to work with local Hardhat network by default. The deployment server runs at:

- **HTTP/WebSocket JSON-RPC**: `http://127.0.0.1:8545/`
- **Chain ID**: 31337

For Polygon Amoy testnet deployment, uncomment the network configuration in `hardhat.config.ts` and set up your `.env` file with:
- `AMOY_RPC_URL`
- `PRIVATE_KEY`
- `POLYGONSCAN_API_KEY` (optional, for contract verification)

## 📁 Project Structure

```
polygon-toolkit/
├── contracts/
│   ├── YaroslavToken.sol           # Basic ERC20 token contract
│   ├── UpgradeableERC20V1.sol      # Upgradeable ERC20 V1 (UUPS)
│   └── UpgradeableERC20V2.sol      # Upgradeable ERC20 V2 (upgraded)
├── scripts/
│   ├── deploy.ts                   # Basic deployment script
│   ├── deploy-v1.ts                # Deploy upgradeable V1
│   ├── upgrade-to-v2.ts            # Upgrade V1 to V2
│   ├── deploy-and-upgrade.ts       # Full deployment + upgrade demo
│   └── check.ts                    # Token verification script
├── test/
│   └── upgrade.test.ts              # Comprehensive upgrade tests
├── docs/
│   └── UPGRADEABLE_CONTRACTS.md    # Complete upgrade documentation
├── hardhat.config.ts               # Hardhat configuration
└── package.json                    # Project dependencies
```

## 🔧 Usage

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy Upgradeable Token (V1)

Deploy to local Hardhat network:
```bash
npx hardhat run scripts/deploy-v1.ts
```

Deploy to Polygon Amoy testnet:
```bash
npx hardhat run scripts/deploy-v1.ts --network amoy
```

### Upgrade to V2

After deploying V1, upgrade to V2:
```bash
PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-to-v2.ts --network amoy
```

Or use the combined script:
```bash
npx hardhat run scripts/deploy-and-upgrade.ts --network amoy
```

### Verify Token Deployment

After deployment, verify the token details:
```bash
npx hardhat run scripts/check.ts
```

This will display:
- Token name
- Token symbol
- Total supply
- Owner balance

### Start Local Hardhat Node

To run a local Hardhat node for testing:
```bash
npx hardhat node
```

Then deploy to localhost:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

## 📝 Contract Details

### UpgradeableERC20V1 & V2

The upgradeable token contracts use OpenZeppelin's UUPS proxy pattern, providing:

**V1 Features:**
- ✅ UUPS upgradeable pattern
- ✅ Ownable access control
- ✅ Pausable functionality
- ✅ Standard ERC20 functionality
- ✅ Initial supply minting

**V2 Features (Upgraded):**
- ✅ All V1 features preserved
- ✅ New `getMetadata()` function
- ✅ New `batchTransfer()` function
- ✅ Version tracking

**Security Features:**
- Owner-only upgrades
- Reinitialization protection
- Storage layout safety
- Emergency pause mechanism

### YaroslavToken.sol

Basic ERC20 token contract (non-upgradeable).

**Contract Address (Local Deployment):**
```
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## 🧪 Testing

Run all tests:
```bash
npx hardhat test
```

Run upgrade tests specifically:
```bash
npx hardhat test test/upgrade.test.ts
```

Run tests with gas reporting:
```bash
REPORT_GAS=true npx hardhat test
```

**Test Coverage:**
- ✅ Deployment and initialization
- ✅ Basic ERC20 functionality
- ✅ Pausable features
- ✅ Upgrade safety (V1 → V2)
- ✅ State preservation
- ✅ Permission control
- ✅ Storage layout consistency

## 📚 Scripts

### deploy-v1.ts
Deploys the upgradeable ERC20 V1 as a UUPS proxy with an initial supply of 1,000,000 tokens.

### upgrade-to-v2.ts
Upgrades an existing V1 proxy to V2 implementation while preserving all state.

### deploy-and-upgrade.ts
Demonstrates the complete flow: deploy V1, perform operations, and upgrade to V2.

### deploy.ts
Deploys the basic (non-upgradeable) Yaroslav token.

### check.ts
Verifies token deployment by checking:
- Token name and symbol
- Total supply
- Owner balance

## 🔐 Security

- ✅ Uses OpenZeppelin's battle-tested UUPS proxy pattern
- ✅ Owner-only upgrade authorization
- ✅ Reinitialization attack prevention
- ✅ Storage layout safety checks
- ✅ Pausable emergency stop mechanism
- ✅ Solidity version 0.8.20 with overflow protection
- ✅ Optimizer enabled for gas efficiency

## 📖 Upgradeable Contracts Documentation

For comprehensive documentation on the upgradeable contracts, see:
- **[Complete Upgrade Guide](./docs/UPGRADEABLE_CONTRACTS.md)** - Architecture, security, and upgrade process

**Key Topics Covered:**
- UUPS proxy pattern architecture
- Storage layout rules and safety
- Upgrade process step-by-step
- Security considerations
- Testing strategies
- Troubleshooting guide

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Note**: The default configuration uses a local Hardhat network. For production or testnet deployments, ensure you have the necessary network configuration and sufficient funds for gas fees.
