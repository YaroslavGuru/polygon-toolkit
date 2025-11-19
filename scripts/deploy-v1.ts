import { ethers, upgrades } from "hardhat";

/**
 * Deploy UpgradeableERC20 V1 as UUPS Proxy
 * 
 * This script deploys the first version of the upgradeable ERC20 token
 * using the UUPS (Universal Upgradeable Proxy Standard) pattern.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const TOKEN_NAME = "Upgradeable Token";
  const TOKEN_SYMBOL = "UPT";
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18); // 1M tokens

  // Deploy V1 implementation
  const UpgradeableERC20V1 = await ethers.getContractFactory("UpgradeableERC20V1");
  
  console.log("\nDeploying UpgradeableERC20V1 as UUPS proxy...");
  
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
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\n✅ Deployment successful!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Proxy Address (use this address):", proxyAddress);
  console.log("Implementation Address (V1):", implementationAddress);
  console.log("Token Name:", TOKEN_NAME);
  console.log("Token Symbol:", TOKEN_SYMBOL);
  console.log("Initial Supply:", ethers.formatUnits(INITIAL_SUPPLY, 18), TOKEN_SYMBOL);
  console.log("Owner:", deployer.address);
  console.log("Version:", await proxy.version());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Verify deployment
  const name = await proxy.name();
  const symbol = await proxy.symbol();
  const totalSupply = await proxy.totalSupply();
  const owner = await proxy.owner();
  const balance = await proxy.balanceOf(deployer.address);

  console.log("Verification:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Total Supply:", ethers.formatUnits(totalSupply, 18), symbol);
  console.log("  Owner:", owner);
  console.log("  Owner Balance:", ethers.formatUnits(balance, 18), symbol);
  console.log("  Paused:", await proxy.paused());
  console.log("\n");

  // Save deployment info (for upgrade script)
  console.log("💡 To upgrade to V2, use:");
  console.log(`   npx hardhat run scripts/upgrade-to-v2.ts --network <network>`);
  console.log(`   With proxy address: ${proxyAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

