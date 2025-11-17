# Polygon Toolkit - Hardhat 3 Project

A comprehensive smart contract toolkit for Polygon Amoy testnet using Hardhat 3, viem, and TypeScript.

## Project Overview

This project includes:

- **Smart Contracts**: ERC20, ERC721, ERC1155 token implementations and a simple Counter contract
- **Hardhat 3** with TypeScript and viem integration
- **TypeScript integration tests** using Node.js native test runner (`node:test`)
- **Deployment scripts** for Polygon Amoy testnet
- **OpenZeppelin Contracts** for secure, audited token implementations

## Contracts

- **Counter.sol**: Simple counter contract with increment/decrement functionality
- **ERC20Token.sol**: ERC20 fungible token implementation
- **ERC721Token.sol**: ERC721 non-fungible token (NFT) implementation
- **ERC1155Token.sol**: ERC1155 multi-token standard implementation

## Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- A Polygon Amoy testnet RPC URL
- A private key with testnet MATIC for deployment

## Setup

1. Clone the repository:
```shell
git clone git@github.com:YaroslavGuru/polygon-toolkit.git
cd polygon-toolkit
```

2. Install dependencies:
```shell
npm install
```

3. Create a `.env` file in the root directory:
```shell
cp .env.example .env
```

4. Fill in your `.env` file with:
```
API_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

## Usage

### Compile Contracts

```shell
npm run compile
```

### Running Tests

Run all tests:
```shell
npm test
```

Run only TypeScript/Node.js tests:
```shell
npm run test:nodejs
```

### Deploy Contracts

Deploy to Polygon Amoy:
```shell
npm run deploy
```

Deploy locally (for testing):
```shell
npm run deploy:local
```

### Verify Contracts

After deployment, verify contracts on Polygonscan:
```shell
npm run verify <contract_address> <constructor_arg1> <constructor_arg2> ...
```

Or use the verification commands provided in the deployment output.

## Project Structure

```
polygon-toolkit/
├── contracts/          # Smart contracts
│   ├── Counter.sol
│   ├── ERC20Token.sol
│   ├── ERC721Token.sol
│   └── ERC1155Token.sol
├── scripts/            # Deployment scripts
│   └── deploy-all.ts
├── test/               # Test files
│   ├── Counter.test.ts
│   ├── ERC20.test.ts
│   ├── ERC721.test.ts
│   └── ERC1155.test.ts
├── ignition/          # Hardhat Ignition modules
│   └── modules/
│       └── Counter.ts
└── hardhat.config.ts  # Hardhat configuration
```

## Network Configuration

The project is configured for **Polygon Amoy** testnet:
- Chain ID: 80002
- RPC URL: Configure via `API_URL` in `.env`
- Explorer: https://amoy.polygonscan.com

## License

MIT
