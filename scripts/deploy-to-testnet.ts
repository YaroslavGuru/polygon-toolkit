import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * @dev Deploy all contracts to Polygon Amoy testnet
 * 
 * This script deploys:
 * - YaroslavToken (standard ERC20)
 * - UpgradeableERC20 (v1 with proxy)
 * - StakingContract
 * - VestingContract
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-to-testnet.ts --network amoy
 * 
 * Requirements:
 *   - .env file with PRIVATE_KEY and POLYGON_AMOY_RPC_URL
 *   - Wallet funded with Amoy native token (POL/MATIC - testnet token)
 */
async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  
  console.log(`\n🚀 Deploying to ${networkName} (Chain ID: ${network.chainId})`);
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\n📋 Deployer Information:");
  console.log("Address:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "POL/MATIC");
  
  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Wallet has 0 balance!");
    console.log("   Please fund your wallet with testnet tokens from:");
    console.log("   https://faucet.polygon.technology/");
    console.log("   (The native token is called POL, but often referred to as MATIC)");
  }

  const deployments: any = {
    network: networkName === "unknown" ? "Polygon Amoy Testnet" : networkName,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    deployments: {},
  };

  try {
    // 1. Deploy YaroslavToken
    console.log("\n📦 Step 1: Deploying YaroslavToken...");
    const Token = await ethers.getContractFactory("Yaroslav");
    const initialSupply = ethers.parseUnits("1000000", 18);
    const token = await Token.deploy(initialSupply);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    const tokenTx = token.deploymentTransaction();
    
    console.log("✅ YaroslavToken deployed!");
    console.log("   Address:", tokenAddress);
    console.log("   Transaction:", tokenTx?.hash);
    
    deployments.deployments.YaroslavToken = {
      address: tokenAddress,
      transactionHash: tokenTx?.hash || "",
      blockNumber: tokenTx?.blockNumber || 0,
    };

    // 2. Deploy UpgradeableERC20
    console.log("\n📦 Step 2: Deploying UpgradeableERC20 (with proxy)...");
    const { upgrades } = require("hardhat");
    const UpgradeableERC20 = await ethers.getContractFactory("UpgradeableERC20");
    
    const upgradeableToken = await upgrades.deployProxy(
      UpgradeableERC20,
      ["Yaroslav", "YARO", initialSupply, deployer.address],
      { 
        initializer: "initialize",
        kind: "uups"
      }
    );
    
    await upgradeableToken.waitForDeployment();
    const proxyAddress = await upgradeableToken.getAddress();
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    const upgradeTx = upgradeableToken.deploymentTransaction();
    
    console.log("✅ UpgradeableERC20 deployed!");
    console.log("   Proxy Address:", proxyAddress);
    console.log("   Implementation:", implementationAddress);
    console.log("   Transaction:", upgradeTx?.hash);
    
    deployments.deployments.UpgradeableERC20 = {
      proxyAddress: proxyAddress,
      implementationAddress: implementationAddress,
      transactionHash: upgradeTx?.hash || "",
      blockNumber: upgradeTx?.blockNumber || 0,
    };

    // 3. Deploy StakingContract
    console.log("\n📦 Step 3: Deploying StakingContract...");
    const StakingContract = await ethers.getContractFactory("StakingContract");
    const rewardRate = ethers.parseUnits("0.1", 18); // 10% APR
    const lockPeriod = 0; // No lock
    
    const staking = await StakingContract.deploy(
      tokenAddress, // Use YaroslavToken for staking
      tokenAddress, // Use same token for rewards
      rewardRate,
      lockPeriod
    );
    
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    const stakingTx = staking.deploymentTransaction();
    
    console.log("✅ StakingContract deployed!");
    console.log("   Address:", stakingAddress);
    console.log("   Staking Token:", tokenAddress);
    console.log("   Reward Token:", tokenAddress);
    console.log("   Reward Rate:", "10% APR");
    console.log("   Transaction:", stakingTx?.hash);
    
    deployments.deployments.StakingContract = {
      address: stakingAddress,
      stakingToken: tokenAddress,
      rewardToken: tokenAddress,
      rewardRate: rewardRate.toString(),
      lockPeriod: lockPeriod.toString(),
      transactionHash: stakingTx?.hash || "",
      blockNumber: stakingTx?.blockNumber || 0,
    };

    // 4. Deploy VestingContract
    console.log("\n📦 Step 4: Deploying VestingContract...");
    const VestingContract = await ethers.getContractFactory("VestingContract");
    
    const vesting = await VestingContract.deploy(tokenAddress);
    await vesting.waitForDeployment();
    const vestingAddress = await vesting.getAddress();
    const vestingTx = vesting.deploymentTransaction();
    
    console.log("✅ VestingContract deployed!");
    console.log("   Address:", vestingAddress);
    console.log("   Vesting Token:", tokenAddress);
    console.log("   Transaction:", vestingTx?.hash);
    
    deployments.deployments.VestingContract = {
      address: vestingAddress,
      vestingToken: tokenAddress,
      transactionHash: vestingTx?.hash || "",
      blockNumber: vestingTx?.blockNumber || 0,
    };

    // Save deployment addresses
    const addressesDir = path.join(__dirname, "..", "addresses");
    const addressesFile = path.join(addressesDir, "amoy.json");
    
    fs.writeFileSync(addressesFile, JSON.stringify(deployments, null, 2));
    console.log("\n💾 Deployment addresses saved to:", addressesFile);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL DEPLOYMENTS COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📊 Deployment Summary:");
    console.log("   YaroslavToken:", tokenAddress);
    console.log("   UpgradeableERC20 (Proxy):", proxyAddress);
    console.log("   StakingContract:", stakingAddress);
    console.log("   VestingContract:", vestingAddress);
    
    console.log("\n🔍 View on Polygonscan:");
    const explorerUrl = network.chainId === 80002n 
      ? "https://amoy.polygonscan.com"
      : `https://explorer.chainId=${network.chainId}`;
    console.log(`   ${explorerUrl}/address/${tokenAddress}`);
    console.log(`   ${explorerUrl}/address/${proxyAddress}`);
    console.log(`   ${explorerUrl}/address/${stakingAddress}`);
    console.log(`   ${explorerUrl}/address/${vestingAddress}`);
    
    console.log("\n📝 Next Steps:");
    console.log("   1. Verify contracts on Polygonscan:");
    console.log("      npx hardhat verify --network amoy <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>");
    console.log("   2. Update README.md with deployment addresses");
    console.log("   3. Test contracts on testnet");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

