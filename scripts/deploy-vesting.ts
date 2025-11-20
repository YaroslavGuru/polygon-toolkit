import { ethers } from "hardhat";

/**
 * @dev Deploy VestingContract
 * 
 * This script deploys a vesting contract for token distribution.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-vesting.ts --network localhost
 * 
 * Environment variables (optional):
 *   VESTING_TOKEN_ADDRESS - Address of token to vest (default: deploys new Yaroslav token)
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying VestingContract with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get or deploy token
  let vestingTokenAddress = process.env.VESTING_TOKEN_ADDRESS;

  if (!vestingTokenAddress) {
    console.log("\nDeploying vesting token (Yaroslav)...");
    const Token = await ethers.getContractFactory("Yaroslav");
    const vestingToken = await Token.deploy(ethers.parseUnits("1000000", 18));
    await vestingToken.waitForDeployment();
    vestingTokenAddress = await vestingToken.getAddress();
    console.log("Vesting token deployed at:", vestingTokenAddress);
  } else {
    console.log("\nUsing existing vesting token:", vestingTokenAddress);
  }

  // Deploy vesting contract
  console.log("\nDeploying VestingContract...");
  const VestingContract = await ethers.getContractFactory("VestingContract");
  const vesting = await VestingContract.deploy(vestingTokenAddress);

  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();

  console.log("\n✅ VestingContract deployed!");
  console.log("Contract address:", vestingAddress);
  console.log("Vesting token:", vestingTokenAddress);

  // Verify deployment
  console.log("\n📊 Contract Verification:");
  console.log("Owner:", await vesting.owner());
  console.log("Total vested amount:", (await vesting.totalVestedAmount()).toString());
  console.log("Total claimed amount:", (await vesting.totalClaimedAmount()).toString());
  console.log("Vesting schedule count:", (await vesting.vestingScheduleCount()).toString());

  console.log("\n💾 Save for reference:");
  console.log(`VESTING_CONTRACT_ADDRESS=${vestingAddress}`);
  console.log(`VESTING_TOKEN_ADDRESS=${vestingTokenAddress}`);

  console.log("\n📝 Example: Create a vesting schedule");
  console.log(`
  const vesting = await ethers.getContractAt("VestingContract", "${vestingAddress}");
  const token = await ethers.getContractAt("Yaroslav", "${vestingTokenAddress}");
  
  // Approve tokens
  await token.approve("${vestingAddress}", ethers.parseUnits("10000", 18));
  
  // Create vesting: 10,000 tokens, 30 day cliff, 1 year vesting
  const tx = await vesting.createVesting(
    "0x...", // beneficiary address
    ethers.parseUnits("10000", 18), // total amount
    0, // start time (0 = now)
    30 * 24 * 60 * 60, // cliff duration (30 days)
    365 * 24 * 60 * 60 // vesting duration (1 year)
  );
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

