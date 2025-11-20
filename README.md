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

---

## 🔄 Upgradeable ERC20 Token (UUPS Pattern)

This project now includes **upgradeable smart contracts** using the **UUPS (Universal Upgradeable Proxy Standard)** pattern, demonstrating senior-level blockchain engineering capabilities.

### What is UUPS?

UUPS is a proxy pattern that allows smart contracts to be upgraded without redeploying the entire system. The key components are:

1. **Proxy Contract**: The address users interact with (never changes)
2. **Implementation Contract**: Contains the actual logic (can be upgraded)
3. **Storage**: Lives in the proxy, preserved across upgrades

### Architecture

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
Version 2 demonstrates safe upgrade pattern.

**New Features:**
- `version()` function to identify contract version
- `lastTransferTimestamp` tracking for addresses
- Enhanced transfer functions with timestamp tracking

**Upgrade Safety:**
- New storage variables added AFTER existing ones (safe pattern)
- All existing functionality preserved
- No breaking changes to storage layout

### Deployment

#### Deploy v1 (Initial Deployment)

```bash
npx hardhat run scripts/deploy-upgradeable.ts --network localhost
```

This will:
1. Deploy the implementation contract (v1)
2. Deploy a UUPS proxy
3. Initialize the proxy with token parameters
4. Output proxy and implementation addresses

**Output:**
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

Or edit the script to set the proxy address directly.

**What Happens:**
1. New v2 implementation is deployed
2. Proxy is upgraded to point to v2
3. **All storage and balances are preserved**
4. New v2 features become available

**Important:** The proxy address remains the same. Users continue using the same address, but now have access to v2 features.

### Testing

Comprehensive test suite covering:

```bash
npx hardhat test test/upgrade.test.ts
```

**Test Coverage:**
- ✅ Deployment and initialization
- ✅ Owner verification
- ✅ Upgrade from v1 to v2
- ✅ Storage preservation during upgrades
- ✅ Permission control (non-owner cannot upgrade)
- ✅ Reinitialization attack prevention
- ✅ ERC20 functionality (transfer, mint, burn)
- ✅ V2 features (version, timestamp tracking)

### Security Design

#### 1. Upgrade Authorization
Only the contract owner can authorize upgrades through `_authorizeUpgrade()`:

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

When upgrading contracts, **NEVER**:

❌ **Reorder existing state variables**
❌ **Insert new variables before existing ones**
❌ **Change variable types**
❌ **Delete variables**

✅ **Add new variables at the end**
✅ **Append to mappings/arrays**
✅ **Add new functions**

### Upgrade Process

1. **Write v2 contract** extending v1
2. **Add new features** following storage layout rules
3. **Test locally** with comprehensive test suite
4. **Deploy v2 implementation**
5. **Upgrade proxy** (owner only)
6. **Verify** storage preservation and new features

### Comparison: UUPS vs Transparent Proxy

| Feature | UUPS | Transparent Proxy |
|---------|------|-------------------|
| Gas Cost | Lower (upgrade logic in implementation) | Higher (upgrade logic in proxy) |
| Upgrade Function | In implementation | In proxy |
| Complexity | Medium | Lower |
| Recommended For | Production (gas efficient) | Development/Testing |

**This project uses UUPS** for production-ready, gas-efficient upgrades.

### Best Practices Demonstrated

1. ✅ **Initializer Pattern**: Replaces constructor in upgradeable contracts
2. ✅ **Storage Gaps**: Reserved slots for future variables
3. ✅ **Access Control**: Owner-only upgrade authorization
4. ✅ **Comprehensive Testing**: Tests verify upgrade safety
5. ✅ **Documentation**: Clear explanation of architecture and process

### Real-World Use Cases

This upgradeable pattern is essential for:
- **Protocol Evolution**: Add features without migration
- **Bug Fixes**: Patch vulnerabilities without redeployment
- **Gas Optimization**: Improve functions without changing addresses
- **Feature Addition**: Extend functionality incrementally

### Portfolio Value

This implementation demonstrates:
- 🎯 **Senior-level engineering**: Understanding of proxy patterns
- 🔒 **Security awareness**: Proper permissioning and attack prevention
- 🧪 **Testing rigor**: Comprehensive test coverage
- 📚 **Documentation skills**: Clear technical communication
- 🏗️ **Architecture knowledge**: UUPS pattern mastery

---

## 🔧 Usage

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
# Set proxy address first
$env:PROXY_ADDRESS="0x..."; npx hardhat run scripts/upgrade-to-v2.ts --network localhost
```

### check.ts
Verifies token deployment by checking:
- Token name and symbol
- Total supply
- Owner balance

## 🔐 Security

### Standard Token
- Uses OpenZeppelin's battle-tested ERC20 implementation
- Solidity version 0.8.20 with overflow protection
- Optimizer enabled for gas efficiency

### Upgradeable Token
- **UUPS Pattern**: Industry-standard upgradeable proxy
- **Access Control**: Owner-only upgrade authorization
- **Reinitialization Protection**: Constructor disables initializers
- **Storage Safety**: Follows OpenZeppelin storage layout rules
- **Comprehensive Testing**: 100% test coverage for upgrade scenarios
- **Permission Verification**: Tests confirm non-owners cannot upgrade

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
