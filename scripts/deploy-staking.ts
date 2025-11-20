import { ethers } from "hardhat";

/**
 * @dev Deploy StakingContract
 * 
 * This script deploys a staking contract with configurable parameters.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-staking.ts --network localhost
 * 
 * Environment variables (optional):
 *   STAKING_TOKEN_ADDRESS - Address of token to stake (default: deploys new Yaroslav token)
 *   REWARD_TOKEN_ADDRESS - Address of reward token (default: uses staking token)
 *   REWARD_RATE - APR in wei (1e18 = 100%, default: 0.1e18 = 10%)
 *   LOCK_PERIOD - Lock period in seconds (default: 0 = no lock)
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying StakingContract with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get or deploy tokens
  let stakingTokenAddress = process.env.STAKING_TOKEN_ADDRESS;
  let rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS;

  if (!stakingTokenAddress) {
    console.log("\nDeploying staking token (Yaroslav)...");
    const Token = await ethers.getContractFactory("Yaroslav");
    const stakingToken = await Token.deploy(ethers.parseUnits("1000000", 18));
    await stakingToken.waitForDeployment();
    stakingTokenAddress = await stakingToken.getAddress();
    console.log("Staking token deployed at:", stakingTokenAddress);
  } else {
    console.log("\nUsing existing staking token:", stakingTokenAddress);
  }

  if (!rewardTokenAddress) {
    rewardTokenAddress = stakingTokenAddress; // Use same token for rewards
    console.log("Using staking token as reward token");
  } else {
    console.log("Using reward token:", rewardTokenAddress);
  }

  // Parse parameters
  const rewardRate = process.env.REWARD_RATE 
    ? BigInt(process.env.REWARD_RATE) 
    : ethers.parseUnits("0.1", 18); // 10% APR default
  
  const lockPeriod = process.env.LOCK_PERIOD 
    ? BigInt(process.env.LOCK_PERIOD) 
    : 0n; // No lock default

  console.log("\nStaking Contract Parameters:");
  console.log("Reward Rate (APR):", ethers.formatUnits(rewardRate, 18), "(" + (Number(rewardRate) / 1e16) + "%)");
  console.log("Lock Period:", lockPeriod.toString(), "seconds");

  // Deploy staking contract
  console.log("\nDeploying StakingContract...");
  const StakingContract = await ethers.getContractFactory("StakingContract");
  const staking = await StakingContract.deploy(
    stakingTokenAddress,
    rewardTokenAddress,
    rewardRate,
    lockPeriod
  );

  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();

  console.log("\n✅ StakingContract deployed!");
  console.log("Contract address:", stakingAddress);
  console.log("Staking token:", stakingTokenAddress);
  console.log("Reward token:", rewardTokenAddress);
  console.log("Reward rate:", ethers.formatUnits(rewardRate, 18));
  console.log("Lock period:", lockPeriod.toString(), "seconds");

  // Verify deployment
  console.log("\n📊 Contract Verification:");
  console.log("Owner:", await staking.owner());
  console.log("Total staked:", (await staking.totalStaked()).toString());
  console.log("Total rewards distributed:", (await staking.totalRewardsDistributed()).toString());

  console.log("\n💾 Save for reference:");
  console.log(`STAKING_CONTRACT_ADDRESS=${stakingAddress}`);
  console.log(`STAKING_TOKEN_ADDRESS=${stakingTokenAddress}`);
  console.log(`REWARD_TOKEN_ADDRESS=${rewardTokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

