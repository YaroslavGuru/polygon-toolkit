import { ethers, upgrades } from "hardhat";

/**
 * Upgrade UpgradeableERC20 from V1 to V2
 * 
 * This script upgrades the existing UUPS proxy to the V2 implementation.
 * 
 * Usage:
 *   npx hardhat run scripts/upgrade-to-v2.ts --network <network>
 * 
 * Environment variables:
 *   PROXY_ADDRESS - Address of the deployed proxy (optional, will prompt if not set)
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading contract with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get proxy address from environment or command line
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS || process.argv[2];
  
  if (!PROXY_ADDRESS) {
    throw new Error(
      "Please provide PROXY_ADDRESS as environment variable or command line argument.\n" +
      "Example: PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-to-v2.ts --network amoy"
    );
  }

  console.log("\nProxy Address:", PROXY_ADDRESS);

  // Get current implementation address
  const currentImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Current Implementation (V1):", currentImplementation);

  // Connect to existing proxy
  const UpgradeableERC20V1 = await ethers.getContractFactory("UpgradeableERC20V1");
  const proxyV1 = await UpgradeableERC20V1.attach(PROXY_ADDRESS);

  // Verify current state
  console.log("\nCurrent State (V1):");
  console.log("  Name:", await proxyV1.name());
  console.log("  Symbol:", await proxyV1.symbol());
  console.log("  Total Supply:", ethers.formatUnits(await proxyV1.totalSupply(), 18));
  console.log("  Owner:", await proxyV1.owner());
  console.log("  Version:", await proxyV1.version());

  // Store state before upgrade for verification
  const ownerBefore = await proxyV1.owner();
  const totalSupplyBefore = await proxyV1.totalSupply();
  const ownerBalanceBefore = await proxyV1.balanceOf(ownerBefore);

  // Deploy V2 implementation
  const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");
  
  console.log("\nUpgrading to V2...");
  
  const proxyV2 = await upgrades.upgradeProxy(PROXY_ADDRESS, UpgradeableERC20V2, {
    kind: "uups"
  });

  await proxyV2.waitForDeployment();
  const newImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);

  console.log("\n✅ Upgrade successful!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Proxy Address (unchanged):", PROXY_ADDRESS);
  console.log("New Implementation Address (V2):", newImplementation);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Verify state preservation
  console.log("State Verification:");
  console.log("  Name:", await proxyV2.name());
  console.log("  Symbol:", await proxyV2.symbol());
  console.log("  Total Supply:", ethers.formatUnits(await proxyV2.totalSupply(), 18));
  console.log("  Owner:", await proxyV2.owner());
  console.log("  Owner Balance:", ethers.formatUnits(await proxyV2.balanceOf(ownerBefore), 18));
  console.log("  Version:", await proxyV2.version());

  // Verify state preservation
  const ownerAfter = await proxyV2.owner();
  const totalSupplyAfter = await proxyV2.totalSupply();
  const ownerBalanceAfter = await proxyV2.balanceOf(ownerBefore);

  console.log("\nState Preservation Check:");
  console.log("  Owner preserved:", ownerAfter === ownerBefore ? "✅" : "❌");
  console.log("  Total Supply preserved:", totalSupplyAfter === totalSupplyBefore ? "✅" : "❌");
  console.log("  Owner Balance preserved:", ownerBalanceAfter === ownerBalanceBefore ? "✅" : "❌");

  // Test new V2 features
  console.log("\nNew V2 Features:");
  const metadata = await proxyV2.getMetadata();
  console.log("  getMetadata():");
  console.log("    Name:", metadata[0]);
  console.log("    Symbol:", metadata[1]);
  console.log("    Total Supply:", ethers.formatUnits(metadata[2], 18));
  console.log("    Version:", metadata[3]);

  console.log("\n✅ All checks passed!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

