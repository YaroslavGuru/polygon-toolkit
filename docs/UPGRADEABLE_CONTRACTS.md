# Upgradeable Smart Contracts - UUPS Pattern Implementation

This document provides comprehensive documentation for the upgradeable ERC20 token implementation using the UUPS (Universal Upgradeable Proxy Standard) pattern.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [UUPS vs Other Proxy Patterns](#uups-vs-other-proxy-patterns)
4. [Storage Layout Rules](#storage-layout-rules)
5. [Security Controls](#security-controls)
6. [Deployment Guide](#deployment-guide)
7. [Upgrade Process](#upgrade-process)
8. [Testing](#testing)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This project implements an upgradeable ERC20 token using OpenZeppelin's UUPS proxy pattern. The implementation allows for:

- ✅ **Upgradeable contracts** without redeploying the entire system
- ✅ **State preservation** across upgrades
- ✅ **Permission-controlled upgrades** (owner-only)
- ✅ **Pausable functionality** for emergency stops
- ✅ **Storage layout safety** to prevent corruption

### Key Components

- **UpgradeableERC20V1**: Initial implementation with basic ERC20 functionality
- **UpgradeableERC20V2**: Upgraded version with additional features
- **UUPS Proxy**: Proxy contract that delegates calls to implementation
- **Implementation Contracts**: Logic contracts that can be upgraded

---

## Architecture

### Proxy Pattern Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User/Contract Interaction                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Proxy Contract                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Storage:                                             │  │
│  │  - _implementation (address)                          │  │
│  │  - _owner (address)                                   │  │
│  │  - _balances (mapping)                                │  │
│  │  - _allowances (mapping)                              │  │
│  │  - _totalSupply (uint256)                             │  │
│  │  - _paused (bool)                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  fallback() {                                         │  │
│  │    delegatecall(_implementation, data)               │  │
│  │  }                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ delegatecall
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Implementation Contract (V1/V2)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Logic Functions:                                    │  │
│  │  - transfer()                                        │  │
│  │  - approve()                                         │  │
│  │  - pause()                                           │  │
│  │  - upgradeTo()                                       │  │
│  │  - version()                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Storage Layout (READ-ONLY, must match proxy)        │  │
│  │  - Same order as proxy storage                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Upgrade Flow

```
┌──────────────┐
│   Deploy V1  │
│ Implementation│
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│  Deploy Proxy│◄─────│  Initialize  │
│  (UUPS)      │      │  (V1 logic)  │
└──────┬───────┘      └──────────────┘
       │
       │ Users interact with Proxy
       │ (Proxy delegates to V1)
       │
       ▼
┌─────────────────────────────────────┐
│  Deploy V2 Implementation           │
└──────┬──────────────────────────────┘
       │
       │ Owner calls upgradeTo(V2)
       │ (via proxy)
       │
       ▼
┌──────────────┐
│  Proxy now   │
│  points to   │
│  V2 logic    │
└──────┬───────┘
       │
       │ Storage preserved
       │ New functions available
       │
       ▼
┌──────────────┐
│   V2 Active  │
└──────────────┘
```

---

## UUPS vs Other Proxy Patterns

### Comparison Table

| Feature | UUPS | Transparent Proxy | Beacon Proxy |
|---------|------|-------------------|--------------|
| **Upgrade Logic** | In implementation | In proxy | In beacon |
| **Gas Cost** | Lower (no proxy overhead) | Higher | Medium |
| **Upgrade Authorization** | Implementation controls | Proxy controls | Beacon controls |
| **Complexity** | Medium | Low | High |
| **Use Case** | Single contract upgrades | Simple upgrades | Multiple contracts |

### Why UUPS?

1. **Gas Efficiency**: Upgrade logic is in the implementation, reducing proxy overhead
2. **Flexibility**: Each implementation can define its own upgrade authorization
3. **Industry Standard**: Used by major protocols (Uniswap V3, etc.)
4. **OpenZeppelin Support**: Well-audited and maintained

### UUPS Key Characteristics

- ✅ Upgrade function (`upgradeTo`) is in the implementation contract
- ✅ Authorization (`_authorizeUpgrade`) is customizable per implementation
- ✅ Proxy uses `delegatecall` to execute implementation logic
- ✅ Storage is in the proxy, logic is in the implementation

---

## Storage Layout Rules

### ⚠️ CRITICAL: Storage Layout Consistency

**The storage layout MUST remain consistent across upgrades. Violating this rule will corrupt your contract state.**

### Rules:

1. **Never remove state variables**
2. **Never reorder state variables**
3. **Never change variable types**
4. **Only append new state variables at the end**

### Example: Correct Storage Layout

```solidity
// V1 - Initial layout
contract UpgradeableERC20V1 {
    // Storage slot 0: from ERC20Upgradeable
    mapping(address => uint256) private _balances;
    
    // Storage slot 1: from ERC20Upgradeable
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Storage slot 2: from ERC20Upgradeable
    uint256 private _totalSupply;
    
    // Storage slot 3: from OwnableUpgradeable
    address private _owner;
    
    // Storage slot 4: from ERC20PausableUpgradeable
    bool private _paused;
}

// V2 - CORRECT: Only appending new variables
contract UpgradeableERC20V2 is UpgradeableERC20V1 {
    // ✅ CORRECT: New variable at the end
    uint256 private _newFeature;
}
```

### Example: Incorrect Storage Layout (DO NOT DO THIS)

```solidity
// V2 - WRONG: Reordering variables
contract UpgradeableERC20V2 is UpgradeableERC20V1 {
    uint256 private _newFeature;  // ❌ WRONG: This will corrupt _paused!
    // Now _paused is at wrong storage slot
}
```

### Storage Layout Verification

OpenZeppelin provides tools to verify storage layout:

```bash
npx hardhat verify-storage-layout
```

---

## Security Controls

### 1. Upgrade Authorization

Only the owner can authorize upgrades:

```solidity
function _authorizeUpgrade(address newImplementation)
    internal
    override
    onlyOwner
{}
```

### 2. Initialization Protection

The `initializer` modifier prevents reinitialization attacks:

```solidity
function initialize(...) public initializer {
    // Can only be called once
}
```

### 3. Constructor Protection

The constructor disables initializers to prevent direct deployment:

```solidity
constructor() {
    _disableInitializers();
}
```

### 4. Pausable Functionality

Emergency stop mechanism for critical situations:

```solidity
function pause() public onlyOwner {
    _pause();
}
```

### 5. Access Control

All critical functions are protected with `onlyOwner`:

- `pause()` / `unpause()`
- `_authorizeUpgrade()`
- `batchTransfer()` (V2)

---

## Deployment Guide

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (`.env` file):
```env
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### Step 1: Deploy V1

```bash
npx hardhat run scripts/deploy-v1.ts --network amoy
```

**Output:**
```
Proxy Address (use this address): 0x...
Implementation Address (V1): 0x...
Token Name: Upgradeable Token
Token Symbol: UPT
Initial Supply: 1000000.0 UPT
Owner: 0x...
Version: 1.0.0
```

**Save the Proxy Address** - this is the address users will interact with.

### Step 2: Verify Contract (Optional)

```bash
npx hardhat verify --network amoy <PROXY_ADDRESS>
```

### Step 3: Upgrade to V2

```bash
PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-to-v2.ts --network amoy
```

Or provide as argument:
```bash
npx hardhat run scripts/upgrade-to-v2.ts --network amoy 0x...
```

**Output:**
```
✅ Upgrade successful!
Proxy Address (unchanged): 0x...
New Implementation Address (V2): 0x...
Version: 2.0.0
```

### Step 4: Verify V2 (Optional)

```bash
npx hardhat verify --network amoy <V2_IMPLEMENTATION_ADDRESS>
```

---

## Upgrade Process

### Manual Upgrade Steps

1. **Deploy New Implementation**
   ```solidity
   UpgradeableERC20V2 v2 = new UpgradeableERC20V2();
   ```

2. **Call upgradeTo on Proxy**
   ```solidity
   proxy.upgradeToAndCall(v2Address, "0x");
   ```

3. **Verify State Preservation**
   - Check balances
   - Check owner
   - Check total supply
   - Test new functions

### Using Hardhat Upgrades Plugin

The Hardhat upgrades plugin simplifies the process:

```typescript
const proxyV2 = await upgrades.upgradeProxy(
  proxyAddress,
  UpgradeableERC20V2
);
```

**Benefits:**
- ✅ Automatic storage layout validation
- ✅ Safety checks
- ✅ Simplified API

---

## Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Specific Test File

```bash
npx hardhat test test/upgrade.test.ts
```

### Test Coverage

The test suite covers:

1. **Deployment and Initialization**
   - ✅ Proxy deployment
   - ✅ Correct initialization
   - ✅ Owner assignment
   - ✅ Reinitialization prevention

2. **Basic Functionality**
   - ✅ Token transfers
   - ✅ Approvals
   - ✅ Balance tracking

3. **Pausable Features**
   - ✅ Pause/unpause by owner
   - ✅ Transfer prevention when paused
   - ✅ Non-owner cannot pause

4. **Upgrade Safety**
   - ✅ Successful upgrade to V2
   - ✅ State preservation
   - ✅ New functions available
   - ✅ Backward compatibility

5. **Permission Control**
   - ✅ Non-owner cannot upgrade
   - ✅ Owner can upgrade
   - ✅ Upgrade authorization works

6. **Storage Layout**
   - ✅ All state variables preserved
   - ✅ No storage corruption

### Example Test Output

```
UpgradeableERC20 - Upgrade Safety and Permission Control
  Deployment and Initialization
    ✓ Should deploy proxy successfully
    ✓ Should initialize with correct parameters
    ✓ Should set owner correctly
    ✓ Should mint initial supply to owner
    ✓ Should return version 1.0.0
    ✓ Should prevent reinitialization
  Basic ERC20 Functionality
    ✓ Should transfer tokens correctly
    ✓ Should allow approval and transferFrom
  Pausable Functionality
    ✓ Should allow owner to pause
    ✓ Should prevent transfers when paused
    ✓ Should allow owner to unpause
    ✓ Should prevent non-owner from pausing
  Upgrade to V2
    ✓ Should upgrade to V2 successfully
    ✓ Should preserve storage after upgrade
    ✓ Should return version 2.0.0
    ✓ Should have new V2 functions
    ✓ Should allow batch transfer in V2
    ✓ Should maintain ERC20 functionality after upgrade
    ✓ Should maintain pausable functionality after upgrade
  Permission Control - Upgrade Authorization
    ✓ Should prevent non-owner from upgrading
    ✓ Should allow owner to upgrade
  Storage Layout Consistency
    ✓ Should maintain all state variables after upgrade

  19 passing
```

---

## Security Considerations

### ✅ Security Best Practices Implemented

1. **Owner-Only Upgrades**: Only contract owner can upgrade
2. **Initialization Protection**: Prevents reinitialization attacks
3. **Storage Layout Safety**: V2 maintains V1 storage layout
4. **Pausable Mechanism**: Emergency stop capability
5. **Access Control**: Critical functions protected

### ⚠️ Security Warnings

1. **Private Key Security**
   - Never commit private keys to version control
   - Use environment variables or secure key management
   - Consider using hardware wallets for production

2. **Upgrade Authorization**
   - Ensure owner address is secure
   - Consider multi-sig for production
   - Implement time-locked upgrades for critical changes

3. **Storage Layout**
   - Always verify storage layout before upgrading
   - Use OpenZeppelin's storage layout checker
   - Test upgrades on testnet first

4. **Implementation Verification**
   - Verify implementation contracts on block explorer
   - Review implementation code before upgrading
   - Consider audit for production contracts

### 🔒 Production Recommendations

1. **Multi-Signature Wallet**: Use multi-sig for owner address
2. **Time-Locked Upgrades**: Implement timelock for critical upgrades
3. **Upgrade Governance**: Consider DAO governance for upgrades
4. **Comprehensive Testing**: Test all upgrade scenarios
5. **Security Audit**: Get professional audit before mainnet deployment

---

## Troubleshooting

### Common Issues

#### 1. "InvalidInitialization" Error

**Problem**: Trying to initialize an already initialized contract.

**Solution**: Use `upgradeToAndCall` for upgrades that need initialization, or ensure contract is not already initialized.

#### 2. "OwnableUnauthorizedAccount" Error

**Problem**: Non-owner trying to call owner-only function.

**Solution**: Ensure you're using the owner account for the transaction.

#### 3. Storage Layout Mismatch

**Problem**: Upgraded contract has corrupted state.

**Solution**: 
- Verify storage layout matches between versions
- Never reorder or remove state variables
- Only append new variables at the end

#### 4. Upgrade Fails

**Problem**: `upgradeTo` transaction reverts.

**Possible Causes**:
- Not the owner
- New implementation has errors
- Storage layout mismatch
- Insufficient gas

**Solution**: Check transaction revert reason and verify all requirements.

#### 5. State Not Preserved

**Problem**: After upgrade, balances or other state is incorrect.

**Solution**:
- Verify storage layout is identical
- Check that upgrade was successful
- Verify proxy address is correct

### Debugging Tips

1. **Check Proxy Address**: Always use the proxy address, not implementation address
2. **Verify Implementation**: Check that implementation address changed after upgrade
3. **Test on Testnet**: Always test upgrades on testnet first
4. **Use Events**: Check upgrade events in transaction logs
5. **Storage Inspection**: Use `cast storage` or similar tools to inspect storage

---

## Additional Resources

- [OpenZeppelin UUPS Documentation](https://docs.openzeppelin.com/upgrades-plugins/1.x/uups-upgradeable)
- [OpenZeppelin Proxy Patterns](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies)
- [Hardhat Upgrades Plugin](https://docs.openzeppelin.com/upgrades-plugins/1.x/hardhat-upgrades)
- [Storage Layout Documentation](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable)

---

## License

MIT License - See LICENSE file for details.

---

**Last Updated**: 2024
**Version**: 2.0.0

