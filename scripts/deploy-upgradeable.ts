import { ethers, upgrades } from "hardhat";

/**
 * @dev Deploy upgradeable ERC20 token (v1) using UUPS proxy pattern
 * 
 * This script:
 * 1. Deploys the implementation contract (UpgradeableERC20)
 * 2. Deploys a UUPS proxy pointing to the implementation
 * 3. Initializes the proxy with token parameters
 * 
 * The proxy address is the address users interact with.
 * The implementation can be upgraded later without changing the proxy address.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying upgradeable ERC20 token with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Token parameters
  const tokenName = "Yaroslav";
  const tokenSymbol = "YARO";
  const initialSupply = ethers.parseUnits("1000000", 18); // 1M tokens

  // Deploy the upgradeable contract
  const UpgradeableERC20 = await ethers.getContractFactory("UpgradeableERC20");
  
  console.log("\nDeploying proxy and implementation...");
  const token = await upgrades.deployProxy(
    UpgradeableERC20,
    [tokenName, tokenSymbol, initialSupply, deployer.address],
    { 
      initializer: "initialize",
      kind: "uups" // Use UUPS proxy pattern
    }
  );

  await token.waitForDeployment();
  const proxyAddress = await token.getAddress();

  console.log("\n✅ Upgradeable ERC20 token deployed!");
  console.log("Proxy address (use this address):", proxyAddress);
  
  // Get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Implementation address:", implementationAddress);

  // Verify deployment
  console.log("\n📊 Token Details:");
  console.log("Name:", await token.name());
  console.log("Symbol:", await token.symbol());
  console.log("Total Supply:", (await token.totalSupply()).toString());
  console.log("Owner:", await token.owner());
  console.log("Owner Balance:", (await token.balanceOf(deployer.address)).toString());

  // Save deployment info (optional - for upgrade script)
  console.log("\n💾 Save these addresses for future upgrades:");
  console.log(`PROXY_ADDRESS=${proxyAddress}`);
  console.log(`IMPLEMENTATION_ADDRESS=${implementationAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

