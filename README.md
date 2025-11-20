# Polygon Toolkit - ERC20 Token Deployment & Upgradeable Contracts

<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue?logo=solidity)
![Hardhat](https://img.shields.io/badge/Hardhat-2.22.5-yellow?logo=ethereum)
![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-4.9.6-green)
![License](https://img.shields.io/badge/License-MIT-blue)

**A production-ready Hardhat project for deploying and managing ERC20 tokens on Polygon networks with upgradeable contract support using UUPS pattern.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Testing](#-testing) • [Contributing](#-contributing)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Contract Details](#-contract-details)
- [Upgradeable Contracts (UUPS)](#-upgradeable-contracts-uups-pattern)
- [Usage Guide](#-usage-guide)
- [Testing](#-testing)
- [Security](#-security)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

This project provides a complete toolkit for deploying and managing ERC20 tokens on Polygon networks. It includes both standard and upgradeable token implementations, demonstrating production-ready smart contract development practices.

### Key Highlights

- ✅ **Standard ERC20 Token**: Simple, non-upgradeable token implementation
- ✅ **Upgradeable ERC20 (UUPS)**: Production-ready upgradeable token with v1 and v2 implementations
- ✅ **Comprehensive Testing**: 16+ tests covering all scenarios
- ✅ **Security First**: OpenZeppelin audited contracts with best practices
- ✅ **Full Documentation**: Detailed guides and architecture documentation
- ✅ **Deployment Scripts**: Ready-to-use scripts for deployment and upgrades

---

## ✨ Features

### Standard Token (`YaroslavToken.sol`)
- 🪙 Standard ERC20 token functionality
- 🔒 OpenZeppelin audited implementation
- 💰 Initial supply minting
- 📊 18 decimal places

### Upgradeable Token (`UpgradeableERC20`)
- 🔄 **UUPS Proxy Pattern**: Industry-standard upgradeable contracts
- 🔐 **Security Controls**: Owner-only upgrades, reinitialization prevention
- 📦 **Storage Safety**: Automatic storage layout validation
- 🧪 **Comprehensive Tests**: 16 tests covering all upgrade scenarios
- 📈 **Version Management**: v1 and v2 implementations with safe upgrade path

### Developer Experience
- 🛠️ **TypeScript Support**: Full type safety with TypeChain
- 📝 **Detailed Documentation**: Architecture guides and best practices
- 🚀 **Ready-to-Use Scripts**: Deployment and upgrade automation
- 🧪 **Test Coverage**: Unit and integration tests

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v16 or higher ([Download](https://nodejs.org/))
- **npm**: v7 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))

### Optional (for testnet deployment)
- **MetaMask** or compatible wallet
- **Polygon Amoy** testnet tokens (for gas fees)
- **Polygonscan API Key** (for contract verification)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone git@github.com:YaroslavGuru/polygon-toolkit.git
cd polygon-toolkit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Run Tests

```bash
npx hardhat test
```

### 5. Deploy (Choose One)

**Standard Token:**
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

**Upgradeable Token:**
```bash
npx hardhat run scripts/deploy-upgradeable.ts --network localhost
```

---

## 📁 Project Structure

```
polygon-toolkit/
├── contracts/                          # Smart contracts
│   ├── YaroslavToken.sol              # Standard ERC20 token contract
│   ├── UpgradeableERC20.sol           # Upgradeable ERC20 v1 (UUPS pattern)
│   ├── UpgradeableERC20V2.sol         # Upgradeable ERC20 v2 (with new features)
│   └── Lock.sol                       # Example contract (Hardhat template)
│
├── scripts/                            # Deployment and utility scripts
│   ├── deploy.ts                       # Deploy standard Yaroslav token
│   ├── deploy-upgradeable.ts          # Deploy upgradeable ERC20 v1
│   ├── upgrade-to-v2.ts               # Upgrade proxy from v1 to v2
│   └── check.ts                        # Verify token deployment
│
├── test/                               # Test files
│   ├── upgrade.test.ts                 # Comprehensive upgrade tests (16 tests)
│   └── Lock.ts                         # Example test (Hardhat template)
│
├── docs/                               # Documentation
│   └── UPGRADEABLE_CONTRACTS.md        # Detailed upgradeable contracts guide
│
├── artifacts/                           # Compiled contracts (auto-generated)
├── cache/                              # Hardhat cache (auto-generated)
├── typechain-types/                    # TypeScript types (auto-generated)
│
├── hardhat.config.ts                   # Hardhat configuration
├── package.json                        # Project dependencies
├── tsconfig.json                       # TypeScript configuration
├── README.md                           # This file
├── PR_DOCUMENTATION.md                 # PR documentation and review guide
└── PR_QUICK_REFERENCE.md               # Quick PR reference
```

### Key Directories

- **`contracts/`**: All Solidity smart contracts
  - `YaroslavToken.sol`: Standard non-upgradeable ERC20 token
  - `UpgradeableERC20.sol`: Base upgradeable token (v1)
  - `UpgradeableERC20V2.sol`: Upgraded version with new features

- **`scripts/`**: Deployment and management scripts
  - Standard token deployment
  - Upgradeable token deployment
  - Upgrade execution
  - Token verification

- **`test/`**: Comprehensive test suites
  - Upgrade safety tests
  - Permission control tests
  - Storage preservation tests

- **`docs/`**: Technical documentation
  - Architecture guides
  - Security considerations
  - Best practices

---

## 📝 Contract Details

### YaroslavToken.sol

A standard, non-upgradeable ERC20 token implementation using OpenZeppelin's battle-tested contracts.

**Features:**
- ✅ Standard ERC20 token functionality
- ✅ Initial supply minted to deployer
- ✅ 18 decimal places
- ✅ OpenZeppelin audited contracts
- ✅ Solidity 0.8.20 with overflow protection

**Token Specifications:**
- **Name**: Yaroslav
- **Symbol**: YARO
- **Total Supply**: 1,000,000 YARO
- **Decimals**: 18

**Deployment:**
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

---

## 🔄 Upgradeable ERC20 Token (UUPS Pattern)

This project implements **upgradeable smart contracts** using the **UUPS (Universal Upgradeable Proxy Standard)** pattern, demonstrating senior-level blockchain engineering capabilities.

### What is UUPS?

UUPS is a proxy pattern that allows smart contracts to be upgraded without redeploying the entire system. The key components are:

1. **Proxy Contract**: The address users interact with (never changes)
2. **Implementation Contract**: Contains the actual logic (can be upgraded)
3. **Storage**: Lives in the proxy, preserved across upgrades

### Architecture Diagram

```
┌─────────────────┐
│   Proxy (UUPS)  │  ← Users always interact with this address
│                 │
│  Storage Layer  │  ← All state variables stored here
│  - balances     │
│  - totalSupply  │
│  - owner        │
└────────┬────────┘
         │ delegates calls to
         ▼
┌─────────────────┐
│ Implementation  │  ← Logic contract (can be upgraded)
│  - transfer()   │
│  - mint()       │
│  - burn()       │
└─────────────────┘
```

### Contracts

#### UpgradeableERC20.sol (v1)
The base upgradeable ERC20 token implementation.

**Key Features:**
- ✅ UUPS upgradeable pattern
- ✅ Owner-controlled upgrades
- ✅ Reinitialization attack prevention
- ✅ Standard ERC20 functionality
- ✅ Mint and burn functions

**Security Controls:**
- `onlyOwner` modifier for upgrades
- `_disableInitializers()` in constructor
- `initializer` modifier prevents reinitialization
- Storage layout consistency enforced

#### UpgradeableERC20V2.sol
Version 2 demonstrates safe upgrade pattern with new features.

**New Features:**
- `version()` function to identify contract version
- `lastTransferTimestamp` tracking for addresses
- Enhanced transfer functions with timestamp tracking

**Upgrade Safety:**
- New storage variables added AFTER existing ones (safe pattern)
- All existing functionality preserved
- No breaking changes to storage layout

### Deployment Guide

#### Deploy v1 (Initial Deployment)

```bash
npx hardhat run scripts/deploy-upgradeable.ts --network localhost
```

**What happens:**
1. Deploys the implementation contract (v1)
2. Deploys a UUPS proxy
3. Initializes the proxy with token parameters
4. Outputs proxy and implementation addresses

**Expected Output:**
```
✅ Upgradeable ERC20 token deployed!
Proxy address (use this address): 0x...
Implementation address: 0x...
```

#### Upgrade to v2

```bash
# Set proxy address (from v1 deployment)
$env:PROXY_ADDRESS="0x..."; npx hardhat run scripts/upgrade-to-v2.ts --network localhost
```

**What happens:**
1. New v2 implementation is deployed
2. Proxy is upgraded to point to v2
3. **All storage and balances are preserved**
4. New v2 features become available

**Important:** The proxy address remains the same. Users continue using the same address, but now have access to v2 features.

### Security Design

#### 1. Upgrade Authorization
Only the contract owner can authorize upgrades:

```solidity
function _authorizeUpgrade(address newImplementation) 
    internal 
    override 
    onlyOwner 
{
    require(newImplementation != address(0), "Invalid address");
}
```

#### 2. Reinitialization Prevention
Constructor disables initializers to prevent reinitialization attacks:

```solidity
constructor() {
    _disableInitializers();
}
```

#### 3. Storage Layout Safety
- New state variables added **after** existing ones
- No reordering of existing variables
- No deletion of variables
- Follows OpenZeppelin's storage layout rules

#### 4. Permission Control
- `OwnableUpgradeable` for access control
- Owner-only functions: `mint()`, upgrades
- Public functions: `transfer()`, `burn()`

### Storage Layout Rules

**⚠️ CRITICAL: When upgrading contracts, NEVER:**

❌ Reorder existing state variables  
❌ Insert new variables before existing ones  
❌ Change variable types  
❌ Delete variables  

**✅ ALWAYS:**

✅ Add new variables at the end  
✅ Append to mappings/arrays  
✅ Add new functions  

### Comparison: UUPS vs Transparent Proxy

| Feature | UUPS | Transparent Proxy |
|---------|------|-------------------|
| Gas Cost | Lower (upgrade logic in implementation) | Higher (upgrade logic in proxy) |
| Upgrade Function | In implementation | In proxy |
| Complexity | Medium | Lower |
| Recommended For | Production (gas efficient) | Development/Testing |

**This project uses UUPS** for production-ready, gas-efficient upgrades.

---

## 🔧 Usage Guide

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy Standard Token

**Local Network:**
```bash
npx hardhat run scripts/deploy.ts
```

**Polygon Amoy Testnet:**
```bash
npx hardhat run scripts/deploy.ts --network amoy
```

### Deploy Upgradeable Token

**Local Network:**
```bash
npx hardhat run scripts/deploy-upgradeable.ts --network localhost
```

**Polygon Amoy Testnet:**
```bash
npx hardhat run scripts/deploy-upgradeable.ts --network amoy
```

### Upgrade to v2

**Local Network:**
```bash
$env:PROXY_ADDRESS="0x..."; npx hardhat run scripts/upgrade-to-v2.ts --network localhost
```

**Polygon Amoy Testnet:**
```bash
$env:PROXY_ADDRESS="0x..."; npx hardhat run scripts/upgrade-to-v2.ts --network amoy
```

### Verify Token Deployment

```bash
npx hardhat run scripts/check.ts
```

**Output includes:**
- Token name and symbol
- Total supply
- Owner balance

### Start Local Hardhat Node

```bash
npx hardhat node
```

Then deploy to localhost:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

---

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Upgrade Tests Only

```bash
npx hardhat test test/upgrade.test.ts
```

### Run Tests with Gas Reporting

```bash
REPORT_GAS=true npx hardhat test
```

### Test Coverage

The upgradeable contracts include **16 comprehensive tests** covering:

- ✅ Deployment and initialization (4 tests)
- ✅ ERC20 functionality (4 tests)
- ✅ Upgrade from v1 to v2 (4 tests)
- ✅ Permission control (2 tests)
- ✅ Storage safety (1 test)
- ✅ Implementation verification (1 test)

**All tests passing** ✅

---

## 🔐 Security

### Standard Token Security

- ✅ Uses OpenZeppelin's battle-tested ERC20 implementation
- ✅ Solidity version 0.8.20 with overflow protection
- ✅ Optimizer enabled for gas efficiency
- ✅ No known vulnerabilities

### Upgradeable Token Security

- ✅ **UUPS Pattern**: Industry-standard upgradeable proxy
- ✅ **Access Control**: Owner-only upgrade authorization
- ✅ **Reinitialization Protection**: Constructor disables initializers
- ✅ **Storage Safety**: Follows OpenZeppelin storage layout rules
- ✅ **Comprehensive Testing**: 100% test coverage for upgrade scenarios
- ✅ **Permission Verification**: Tests confirm non-owners cannot upgrade

### Security Best Practices

1. **Always test upgrades locally first**
2. **Verify storage layout before upgrading**
3. **Use OpenZeppelin's upgrades plugin**
4. **Comprehensive test coverage**
5. **Document all upgrades**
6. **Consider timelock for production upgrades**
7. **Use multi-sig for owner account in production**

---

## 📚 Documentation

### Available Documentation

- **[README.md](./README.md)**: This file - project overview and quick start
- **[UPGRADEABLE_CONTRACTS.md](./docs/UPGRADEABLE_CONTRACTS.md)**: Detailed guide on upgradeable contracts
- **[PR_DOCUMENTATION.md](./PR_DOCUMENTATION.md)**: PR review guide and code review checklist
- **[PR_QUICK_REFERENCE.md](./PR_QUICK_REFERENCE.md)**: Quick PR reference

### External Resources

- [OpenZeppelin Upgrades Plugin](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [UUPS Pattern Documentation](https://eips.ethereum.org/EIPS/eip-1822)
- [Storage Layout Rules](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable)
- [Hardhat Documentation](https://hardhat.org/docs)

---

## 📚 Scripts Reference

### deploy.ts
Deploys the standard Yaroslav token with an initial supply of 1,000,000 tokens to the deployer address.

**Usage:**
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### deploy-upgradeable.ts
Deploys the upgradeable ERC20 token (v1) using UUPS proxy pattern.

**Usage:**
```bash
npx hardhat run scripts/deploy-upgradeable.ts --network localhost
```

### upgrade-to-v2.ts
Upgrades the proxy from v1 to v2 implementation.

**Usage:**
```bash
$env:PROXY_ADDRESS="0x..."; npx hardhat run scripts/upgrade-to-v2.ts --network localhost
```

### check.ts
Verifies token deployment by checking:
- Token name and symbol
- Total supply
- Owner balance

**Usage:**
```bash
npx hardhat run scripts/check.ts
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npx hardhat test
   ```
5. **Commit your changes**
   ```bash
   git commit -m "feat: Add your feature"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Follow security best practices

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For issues and questions:
- **GitHub Issues**: [Open an issue](https://github.com/YaroslavGuru/polygon-toolkit/issues)
- **Documentation**: Check the [docs](./docs/) directory
- **Examples**: See the [scripts](./scripts/) directory

---

## 🎓 Portfolio Value

This implementation demonstrates:

- 🎯 **Senior-level engineering**: Understanding of proxy patterns
- 🔒 **Security awareness**: Proper permissioning and attack prevention
- 🧪 **Testing rigor**: Comprehensive test coverage
- 📚 **Documentation skills**: Clear technical communication
- 🏗️ **Architecture knowledge**: UUPS pattern mastery
- 🚀 **Production readiness**: Real-world upgrade scenarios

---

## ⚠️ Important Notes

- **Default Configuration**: Uses local Hardhat network for development
- **Production Deployment**: Ensure proper network configuration and sufficient funds for gas fees
- **Security**: Review all security considerations before production deployment
- **Testing**: Always test upgrades locally before deploying to mainnet

---

<div align="center">

**Built with ❤️ for the Polygon ecosystem**

[⭐ Star this repo](https://github.com/YaroslavGuru/polygon-toolkit) • [🐛 Report Bug](https://github.com/YaroslavGuru/polygon-toolkit/issues) • [💡 Request Feature](https://github.com/YaroslavGuru/polygon-toolkit/issues)

</div>
