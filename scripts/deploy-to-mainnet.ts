import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * @dev Deploy a simple contract to Polygon Mainnet
 * 
 * This script deploys YaroslavToken to Polygon Mainnet as a demonstration.
 * 
 * ⚠️ WARNING: This will use REAL MATIC on Polygon Mainnet!
 * Make sure you:
 * 1. Have sufficient MATIC for gas fees
 * 2. Have tested thoroughly on testnet
 * 3. Understand the contract you're deploying
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-to-mainnet.ts --network polygon
 * 
 * Requirements:
 *   - .env file with PRIVATE_KEY and POLYGON_MAINNET_RPC_URL
 *   - Wallet funded with Polygon MATIC
 */
async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  
  console.log(`\n🚀 Deploying to ${networkName} (Chain ID: ${network.chainId})`);
  console.log("=" .repeat(60));
  console.log("⚠️  WARNING: This is MAINNET deployment!");
  console.log("⚠️  Make sure you have tested on testnet first!");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\n📋 Deployer Information:");
  console.log("Address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC");
  
  if (balance < ethers.parseEther("0.1")) {
    console.error("\n❌ Insufficient balance! Need at least 0.1 MATIC for deployment.");
    process.exit(1);
  }

  const deployments: any = {
    network: "Polygon Mainnet",
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    deployments: {},
  };

  try {
    // Deploy YaroslavToken (simple contract for mainnet)
    console.log("\n📦 Deploying YaroslavToken to Polygon Mainnet...");
    const Token = await ethers.getContractFactory("Yaroslav");
    const initialSupply = ethers.parseUnits("1000000", 18);
    
    console.log("   Initial Supply:", ethers.formatUnits(initialSupply, 18), "tokens");
    console.log("   Deploying...");
    
    const token = await Token.deploy(initialSupply);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    const tokenTx = token.deploymentTransaction();
    
    // Wait for transaction confirmation
    if (tokenTx) {
      console.log("   Waiting for confirmation...");
      await tokenTx.wait(3); // Wait for 3 confirmations
    }
    
    console.log("\n✅ YaroslavToken deployed successfully!");
    console.log("   Address:", tokenAddress);
    console.log("   Transaction:", tokenTx?.hash);
    console.log("   Block Number:", tokenTx?.blockNumber || "pending");
    
    // Get gas used
    if (tokenTx) {
      const receipt = await ethers.provider.getTransactionReceipt(tokenTx.hash);
      if (receipt) {
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.gasPrice || 0n;
        const cost = gasUsed * gasPrice;
        console.log("   Gas Used:", gasUsed.toString());
        console.log("   Cost:", ethers.formatEther(cost), "MATIC");
      }
    }
    
    deployments.deployments.YaroslavToken = {
      address: tokenAddress,
      transactionHash: tokenTx?.hash || "",
      blockNumber: tokenTx?.blockNumber || 0,
      initialSupply: initialSupply.toString(),
    };

    // Save deployment addresses
    const addressesDir = path.join(__dirname, "..", "addresses");
    const addressesFile = path.join(addressesDir, "mainnet.json");
    
    fs.writeFileSync(addressesFile, JSON.stringify(deployments, null, 2));
    console.log("\n💾 Deployment addresses saved to:", addressesFile);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ MAINNET DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📊 Deployment Summary:");
    console.log("   Network: Polygon Mainnet");
    console.log("   Contract: YaroslavToken");
    console.log("   Address:", tokenAddress);
    
    console.log("\n🔍 View on Polygonscan:");
    console.log(`   https://polygonscan.com/address/${tokenAddress}`);
    
    console.log("\n📝 Next Steps:");
    console.log("   1. Verify contract on Polygonscan:");
    console.log(`      npx hardhat verify --network polygon ${tokenAddress} ${initialSupply}`);
    console.log("   2. Update README.md with mainnet address");
    console.log("   3. Share deployment with community");

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

