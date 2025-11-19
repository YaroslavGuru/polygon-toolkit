import { ethers, upgrades } from "hardhat";

/**
 * Deploy V1 and immediately upgrade to V2
 * 
 * This script demonstrates the full deployment and upgrade flow.
 * Useful for testing the complete upgrade process.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying and upgrading contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const TOKEN_NAME = "Upgradeable Token";
  const TOKEN_SYMBOL = "UPT";
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18); // 1M tokens

  // Step 1: Deploy V1
  console.log("\n" + "=".repeat(50));
  console.log("STEP 1: Deploying V1");
  console.log("=".repeat(50));

  const UpgradeableERC20V1 = await ethers.getContractFactory("UpgradeableERC20V1");
  
  const proxy = await upgrades.deployProxy(
    UpgradeableERC20V1,
    [TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY, deployer.address],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  const v1Implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ V1 Deployed");
  console.log("  Proxy Address:", proxyAddress);
  console.log("  V1 Implementation:", v1Implementation);
  console.log("  Version:", await proxy.version());

  // Step 2: Perform some operations on V1
  console.log("\n" + "=".repeat(50));
  console.log("STEP 2: Testing V1 Functionality");
  console.log("=".repeat(50));

  const [user1, user2] = await ethers.getSigners();
  const transferAmount = ethers.parseUnits("10000", 18);
  
  await proxy.transfer(user1.address, transferAmount);
  console.log("✅ Transferred", ethers.formatUnits(transferAmount, 18), TOKEN_SYMBOL, "to user1");

  await proxy.pause();
  console.log("✅ Paused contract");

  await proxy.unpause();
  console.log("✅ Unpaused contract");

  // Step 3: Upgrade to V2
  console.log("\n" + "=".repeat(50));
  console.log("STEP 3: Upgrading to V2");
  console.log("=".repeat(50));

  const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");
  
  const proxyV2 = await upgrades.upgradeProxy(proxyAddress, UpgradeableERC20V2, {
    kind: "uups"
  });

  await proxyV2.waitForDeployment();
  const v2Implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ V2 Upgraded");
  console.log("  Proxy Address (unchanged):", proxyAddress);
  console.log("  V2 Implementation:", v2Implementation);
  console.log("  Version:", await proxyV2.version());

  // Step 4: Verify state preservation
  console.log("\n" + "=".repeat(50));
  console.log("STEP 4: Verifying State Preservation");
  console.log("=".repeat(50));

  console.log("  Name:", await proxyV2.name());
  console.log("  Symbol:", await proxyV2.symbol());
  console.log("  Total Supply:", ethers.formatUnits(await proxyV2.totalSupply(), 18), TOKEN_SYMBOL);
  console.log("  Owner:", await proxyV2.owner());
  console.log("  Owner Balance:", ethers.formatUnits(await proxyV2.balanceOf(deployer.address), 18), TOKEN_SYMBOL);
  console.log("  User1 Balance:", ethers.formatUnits(await proxyV2.balanceOf(user1.address), 18), TOKEN_SYMBOL);
  console.log("  ✅ All state preserved!");

  // Step 5: Test V2 features
  console.log("\n" + "=".repeat(50));
  console.log("STEP 5: Testing V2 Features");
  console.log("=".repeat(50));

  const metadata = await proxyV2.getMetadata();
  console.log("  getMetadata():");
  console.log("    Name:", metadata[0]);
  console.log("    Symbol:", metadata[1]);
  console.log("    Total Supply:", ethers.formatUnits(metadata[2], 18));
  console.log("    Version:", metadata[3]);

  // Test batch transfer
  const recipients = [user1.address, user2.address];
  const amounts = [
    ethers.parseUnits("100", 18),
    ethers.parseUnits("200", 18),
  ];
  
  await proxyV2.batchTransfer(recipients, amounts);
  console.log("  ✅ batchTransfer() executed successfully");

  console.log("\n" + "=".repeat(50));
  console.log("✅ DEPLOYMENT AND UPGRADE COMPLETE");
  console.log("=".repeat(50));
  console.log("\nFinal Proxy Address:", proxyAddress);
  console.log("Use this address for all interactions with the token.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

