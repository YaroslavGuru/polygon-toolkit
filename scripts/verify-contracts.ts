import { run } from "hardhat";
import { ethers } from "hardhat";
import hre from "hardhat";

/**
 * @dev Verify deployed contracts on Polygonscan
 * 
 * This script verifies contracts that have been deployed.
 * It reads addresses from addresses/amoy.json or addresses/mainnet.json
 * 
 * Usage:
 *   npx hardhat run scripts/verify-contracts.ts --network amoy
 *   npx hardhat run scripts/verify-contracts.ts --network polygon
 * 
 * Requirements:
 *   - POLYGONSCAN_API_KEY in .env
 *   - Deployment addresses in addresses/ directory
 */
async function main() {
  const network = await hre.ethers.provider.getNetwork();
  const networkName = network.name;
  
  console.log(`\n🔍 Verifying contracts on ${networkName} (Chain ID: ${network.chainId})`);
  console.log("=" .repeat(60));

  const fs = require("fs");
  const path = require("path");
  
  const addressesFile = network.chainId === 137n
    ? path.join(__dirname, "..", "addresses", "mainnet.json")
    : path.join(__dirname, "..", "addresses", "amoy.json");

  if (!fs.existsSync(addressesFile)) {
    console.error(`\n❌ Address file not found: ${addressesFile}`);
    console.error("   Please deploy contracts first using deploy-to-testnet.ts or deploy-to-mainnet.ts");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(addressesFile, "utf8"));
  
  console.log("\n📋 Contracts to verify:");
  console.log(JSON.stringify(deployments.deployments, null, 2));

  try {
    // Verify YaroslavToken
    if (deployments.deployments.YaroslavToken?.address) {
      console.log("\n🔍 Verifying YaroslavToken...");
      const tokenAddress = deployments.deployments.YaroslavToken.address;
      const initialSupply = deployments.deployments.YaroslavToken.initialSupply || ethers.parseUnits("1000000", 18);
      
      await run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [initialSupply],
      });
      
      console.log("✅ YaroslavToken verified!");
    }

    // Verify UpgradeableERC20 (proxy)
    if (deployments.deployments.UpgradeableERC20?.proxyAddress) {
      console.log("\n🔍 Verifying UpgradeableERC20...");
      const proxyAddress = deployments.deployments.UpgradeableERC20.proxyAddress;
      const implementationAddress = deployments.deployments.UpgradeableERC20.implementationAddress;
      
      // Verify implementation
      console.log("   Verifying implementation...");
      await run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [],
      });
      
      // Note: Proxy verification is automatic when implementation is verified
      console.log("✅ UpgradeableERC20 verified!");
      console.log("   Note: Proxy verification is handled automatically");
    }

    // Verify StakingContract
    if (deployments.deployments.StakingContract?.address) {
      console.log("\n🔍 Verifying StakingContract...");
      const stakingAddress = deployments.deployments.StakingContract.address;
      const stakingToken = deployments.deployments.StakingContract.stakingToken;
      const rewardToken = deployments.deployments.StakingContract.rewardToken;
      const rewardRate = deployments.deployments.StakingContract.rewardRate || ethers.parseUnits("0.1", 18);
      const lockPeriod = deployments.deployments.StakingContract.lockPeriod || 0;
      
      await run("verify:verify", {
        address: stakingAddress,
        constructorArguments: [stakingToken, rewardToken, rewardRate, lockPeriod],
      });
      
      console.log("✅ StakingContract verified!");
    }

    // Verify VestingContract
    if (deployments.deployments.VestingContract?.address) {
      console.log("\n🔍 Verifying VestingContract...");
      const vestingAddress = deployments.deployments.VestingContract.address;
      const vestingToken = deployments.deployments.VestingContract.vestingToken;
      
      await run("verify:verify", {
        address: vestingAddress,
        constructorArguments: [vestingToken],
      });
      
      console.log("✅ VestingContract verified!");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ ALL CONTRACTS VERIFIED!");
    console.log("=".repeat(60));
    console.log("\n🔍 View verified contracts on Polygonscan:");
    
    const explorerUrl = network.chainId === 137n
      ? "https://polygonscan.com"
      : "https://amoy.polygonscan.com";
    
    Object.values(deployments.deployments).forEach((deployment: any) => {
      if (deployment.address) {
        console.log(`   ${explorerUrl}/address/${deployment.address}`);
      }
      if (deployment.proxyAddress) {
        console.log(`   ${explorerUrl}/address/${deployment.proxyAddress}`);
      }
    });

  } catch (error: any) {
    if (error.message?.includes("Already Verified")) {
      console.log("ℹ️  Contract already verified");
    } else {
      console.error("\n❌ Verification failed:", error.message);
      process.exitCode = 1;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

