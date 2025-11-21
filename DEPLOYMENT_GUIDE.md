# Deployment Guide

This guide walks you through deploying contracts to Polygon Amoy testnet and Polygon Mainnet.

## 📋 Prerequisites

### 1. Environment Setup

Create a `.env` file in the project root:

```env
# Private key of the deployer wallet (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Polygon Amoy Testnet RPC URL
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY

# Polygon Mainnet RPC URL
POLYGON_MAINNET_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Polygonscan API Key (for contract verification)
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

### 2. Get RPC URLs

**Option 1: Alchemy (Recommended)**
1. Visit https://www.alchemy.com/
2. Create a free account
3. Create a new app
4. Select "Polygon Amoy" or "Polygon" network
5. Copy the HTTP URL

**Option 2: Infura**
1. Visit https://infura.io/
2. Create a free account
3. Create a new project
4. Select "Polygon Amoy" or "Polygon" network
5. Copy the endpoint URL

**Option 3: Public RPC (Less Reliable)**
- Amoy: `https://rpc-amoy.polygon.technology`
- Mainnet: `https://polygon-rpc.com`

### 3. Get Polygonscan API Key

1. Visit https://polygonscan.com/apis
2. Create a free account
3. Go to API-KEYs section
4. Create a new API key
5. Copy the API key

### 4. Fund Your Wallet

**Amoy Testnet:**
- Visit https://faucet.polygon.technology/
- Enter your wallet address
- Request testnet tokens (POL/MATIC - Polygon's native token on testnet)

**Polygon Mainnet:**
- Purchase MATIC from exchanges (Coinbase, Binance, etc.)
- Transfer to your deployment wallet
- Ensure you have at least 0.1 MATIC for gas

## 🚀 Deployment Steps

### Step 1: Deploy to Polygon Amoy Testnet

```bash
npx hardhat run scripts/deploy-to-testnet.ts --network amoy
```

**What this does:**
- Deploys YaroslavToken
- Deploys UpgradeableERC20 (with proxy)
- Deploys StakingContract
- Deploys VestingContract
- Saves addresses to `addresses/amoy.json`

**Expected Output:**
```
🚀 Deploying to amoy (Chain ID: 80002)
📋 Deployer Information:
Address: 0x...
Balance: 1.5 POL/MATIC

📦 Step 1: Deploying YaroslavToken...
✅ YaroslavToken deployed!
   Address: 0x...
   Transaction: 0x...

📦 Step 2: Deploying UpgradeableERC20...
✅ UpgradeableERC20 deployed!
   Proxy Address: 0x...
   Implementation: 0x...

📦 Step 3: Deploying StakingContract...
✅ StakingContract deployed!
   Address: 0x...

📦 Step 4: Deploying VestingContract...
✅ VestingContract deployed!
   Address: 0x...

✅ ALL DEPLOYMENTS COMPLETE!
```

### Step 2: Verify Contracts on Polygonscan

```bash
npx hardhat run scripts/verify-contracts.ts --network amoy
```

**What this does:**
- Verifies all deployed contracts
- Makes source code public on Polygonscan
- Enables contract interaction via explorer

**Expected Output:**
```
🔍 Verifying contracts on amoy (Chain ID: 80002)
🔍 Verifying YaroslavToken...
✅ YaroslavToken verified!
🔍 Verifying UpgradeableERC20...
✅ UpgradeableERC20 verified!
...
✅ ALL CONTRACTS VERIFIED!
```

### Step 3: (Optional) Deploy to Polygon Mainnet

⚠️ **WARNING**: This uses REAL MATIC!

```bash
npx hardhat run scripts/deploy-to-mainnet.ts --network polygon
```

**What this does:**
- Deploys YaroslavToken to Polygon Mainnet
- Saves address to `addresses/mainnet.json`
- Uses real MATIC for gas fees

**Before deploying:**
- ✅ Test thoroughly on testnet
- ✅ Ensure sufficient MATIC balance
- ✅ Double-check all parameters
- ✅ Understand the contract

### Step 4: Verify Mainnet Contracts

```bash
npx hardhat run scripts/verify-contracts.ts --network polygon
```

## 📊 Deployment Addresses

All deployment addresses are saved to:
- `addresses/amoy.json` - Testnet deployments
- `addresses/mainnet.json` - Mainnet deployments

**Example:**
```json
{
  "network": "Polygon Amoy Testnet",
  "chainId": 80002,
  "deployedAt": "2024-01-01T00:00:00.000Z",
  "deployer": "0x...",
  "deployments": {
    "YaroslavToken": {
      "address": "0x...",
      "transactionHash": "0x...",
      "blockNumber": 12345
    }
  }
}
```

## 🔍 View on Polygonscan

After deployment, view contracts on:
- **Amoy**: https://amoy.polygonscan.com/address/{CONTRACT_ADDRESS}
- **Mainnet**: https://polygonscan.com/address/{CONTRACT_ADDRESS}

## 🐛 Troubleshooting

### Error: "private key too short"
- Ensure PRIVATE_KEY doesn't have `0x` prefix
- Check that .env file is in project root
- Verify .env file is loaded (check with `console.log(process.env.PRIVATE_KEY)`)

### Error: "insufficient funds"
- Check wallet balance
- For testnet, get testnet tokens (POL/MATIC) from faucet (https://faucet.polygon.technology/)
- For mainnet, ensure you have enough MATIC
- Note: POL and MATIC refer to the same native token on testnet

### Error: "network not found"
- Check network name in command (should be `amoy` or `polygon`)
- Verify RPC URL is correct in .env
- Ensure PRIVATE_KEY is set

### Error: "contract verification failed"
- Wait a few minutes after deployment
- Check constructor arguments match
- Verify API key is correct
- Try manual verification on Polygonscan

## 📝 Manual Verification

If automatic verification fails, verify manually:

```bash
# YaroslavToken
npx hardhat verify --network amoy 0x... 1000000000000000000000000

# StakingContract
npx hardhat verify --network amoy 0x... 0x... 0x... 100000000000000000 0

# VestingContract
npx hardhat verify --network amoy 0x... 0x...
```

## ✅ Deployment Checklist

**Before Deployment:**
- [ ] .env file configured
- [ ] Wallet funded
- [ ] Contracts tested locally
- [ ] RPC URLs working
- [ ] Polygonscan API key set

**After Deployment:**
- [ ] Contracts deployed successfully
- [ ] Addresses saved to JSON
- [ ] Contracts verified on Polygonscan
- [ ] README updated with addresses
- [ ] Contracts tested on deployed network

## 🔒 Security Best Practices

1. **Never commit .env file** - It's in .gitignore
2. **Use separate deployment wallet** - Don't use main wallet
3. **Test on testnet first** - Always test before mainnet
4. **Verify contracts** - Make source code public
5. **Document everything** - Keep deployment records
6. **Use hardware wallet** - For mainnet deployments
7. **Monitor gas prices** - Deploy during low gas periods

## 📚 Additional Resources

- [Polygon Documentation](https://docs.polygon.technology/)
- [Hardhat Deployment Guide](https://hardhat.org/hardhat-runner/docs/guides/deploying)
- [Polygonscan Verification](https://docs.polygonscan.com/contracts/verification)
- [Alchemy RPC Setup](https://docs.alchemy.com/docs/how-to-add-alchemy-rpc-endpoints-to-metamask)

---

**Ready to deploy?** Start with testnet and work your way up! 🚀

