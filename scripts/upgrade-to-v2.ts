import { ethers, upgrades } from "hardhat";

/**
 * @dev Upgrade the proxy to v2 implementation
 * 
 * This script:
 * 1. Deploys the new v2 implementation contract
 * 2. Upgrades the existing proxy to point to v2
 * 3. Verifies the upgrade was successful
 * 
 * IMPORTANT: The proxy address remains the same, only the implementation changes.
 * All existing storage and balances are preserved.
 * 
 * Usage:
 *   npx hardhat run scripts/upgrade-to-v2.ts --network localhost
 * 
 * Or set PROXY_ADDRESS environment variable:
 *   PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-to-v2.ts --network localhost
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Upgrading upgradeable ERC20 token with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get proxy address from environment or use default (from previous deployment)
  const proxyAddress = process.env.PROXY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  if (!ethers.isAddress(proxyAddress)) {
    throw new Error(`Invalid proxy address: ${proxyAddress}`);
  }

  console.log("\n📋 Upgrade Information:");
  console.log("Proxy address:", proxyAddress);

  // Verify current implementation
  try {
    const currentImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Current implementation:", currentImplementation);
  } catch (error) {
    console.log("⚠️  Could not fetch current implementation (contract may not be deployed yet)");
  }

  // Get current token instance to verify it exists
  const currentToken = await ethers.getContractAt("UpgradeableERC20", proxyAddress);
  const currentName = await currentToken.name();
  const currentSupply = await currentToken.totalSupply();
  const currentOwner = await currentToken.owner();

  console.log("\n📊 Current Token State:");
  console.log("Name:", currentName);
  console.log("Total Supply:", currentSupply.toString());
  console.log("Owner:", currentOwner);

  // Verify deployer is the owner
  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`Deployer ${deployer.address} is not the owner. Owner is ${currentOwner}`);
  }

  // Deploy new implementation (v2)
  console.log("\n🚀 Deploying v2 implementation...");
  const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");
  
  const upgradedToken = await upgrades.upgradeProxy(
    proxyAddress,
    UpgradeableERC20V2,
    {
      kind: "uups"
    }
  );

  await upgradedToken.waitForDeployment();

  // Get new implementation address
  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("\n✅ Upgrade completed successfully!");
  console.log("Proxy address (unchanged):", proxyAddress);
  console.log("New implementation address:", newImplementationAddress);

  // Verify upgrade
  console.log("\n📊 Post-Upgrade Verification:");
  console.log("Name:", await upgradedToken.name());
  console.log("Symbol:", await upgradedToken.symbol());
  console.log("Total Supply:", (await upgradedToken.totalSupply()).toString());
  console.log("Owner:", await upgradedToken.owner());
  console.log("Owner Balance:", (await upgradedToken.balanceOf(deployer.address)).toString());

  // Test v2 features
  try {
    const version = await upgradedToken.version();
    console.log("Version:", version);
    console.log("\n✨ V2 features are now available!");
    console.log("- version() function");
    console.log("- lastTransferTimestamp tracking");
  } catch (error) {
    console.log("⚠️  Could not verify v2 features (may need to check contract)");
  }

  console.log("\n💾 Save for reference:");
  console.log(`PROXY_ADDRESS=${proxyAddress}`);
  console.log(`V2_IMPLEMENTATION_ADDRESS=${newImplementationAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

