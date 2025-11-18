# Polygon Toolkit - ERC20 Token Deployment

A Hardhat-based project for deploying custom ERC20 tokens on Polygon networks. This project includes a complete implementation of the Yaroslav (YARO) token with deployment scripts and verification tools.

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
│   └── YaroslavToken.sol    # ERC20 token contract
├── scripts/
│   ├── deploy.ts            # Deployment script
│   └── check.ts             # Token verification script
├── test/                     # Test files
├── hardhat.config.ts        # Hardhat configuration
└── package.json             # Project dependencies
```

## 🔧 Usage

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy Token

Deploy to local Hardhat network:
```bash
npx hardhat run scripts/deploy.ts
```

Deploy to Polygon Amoy testnet:
```bash
npx hardhat run scripts/deploy.ts --network amoy
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

### YaroslavToken.sol

The token contract is built using OpenZeppelin's ERC20 implementation, ensuring security and standard compliance.

**Features:**
- Standard ERC20 token functionality
- Initial supply minted to deployer
- 18 decimal places
- OpenZeppelin audited contracts

**Contract Address (Local Deployment):**
```
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## 🧪 Testing

Run tests:
```bash
npx hardhat test
```

Run tests with gas reporting:
```bash
REPORT_GAS=true npx hardhat test
```

## 📚 Scripts

### deploy.ts
Deploys the Yaroslav token with an initial supply of 1,000,000 tokens to the deployer address.

### check.ts
Verifies token deployment by checking:
- Token name and symbol
- Total supply
- Owner balance

## 🔐 Security

- Uses OpenZeppelin's battle-tested ERC20 implementation
- Solidity version 0.8.20 with overflow protection
- Optimizer enabled for gas efficiency

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
