import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";

/**
 * @dev Comprehensive test suite for StakingContract
 * 
 * Tests cover:
 * - Staking functionality
 * - Reward calculation and claiming
 * - Withdrawal with and without lock periods
 * - Edge cases and security
 */
describe("StakingContract", function () {
  // Fixture to deploy contracts
  async function deployStakingFixture() {
    const [owner, user1, user2, rewardProvider] = await hre.ethers.getSigners();

    // Deploy test tokens
    const Token = await ethers.getContractFactory("Yaroslav");
    const stakingToken = await Token.deploy(ethers.parseUnits("1000000", 18));
    const rewardToken = await Token.deploy(ethers.parseUnits("1000000", 18));

    await stakingToken.waitForDeployment();
    await rewardToken.waitForDeployment();

    // Deploy staking contract
    // 10% APR = 0.1e18, no lock period
    const StakingContract = await ethers.getContractFactory("StakingContract");
    const staking = await StakingContract.deploy(
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      ethers.parseUnits("0.1", 18), // 10% APR
      0 // No lock period
    );

    await staking.waitForDeployment();

    // Fund users
    await stakingToken.transfer(user1.address, ethers.parseUnits("10000", 18));
    await stakingToken.transfer(user2.address, ethers.parseUnits("10000", 18));
    
    // Fund reward pool
    await rewardToken.transfer(await staking.getAddress(), ethers.parseUnits("100000", 18));

    return {
      staking,
      stakingToken,
      rewardToken,
      owner,
      user1,
      user2,
      rewardProvider,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      const { staking, stakingToken, rewardToken } = await loadFixture(deployStakingFixture);

      expect(await staking.stakingToken()).to.equal(await stakingToken.getAddress());
      expect(await staking.rewardToken()).to.equal(await rewardToken.getAddress());
      expect(await staking.rewardRate()).to.equal(ethers.parseUnits("0.1", 18));
      expect(await staking.lockPeriod()).to.equal(0);
    });

    it("Should set owner correctly", async function () {
      const { staking, owner } = await loadFixture(deployStakingFixture);

      expect(await staking.owner()).to.equal(owner.address);
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      const { staking, stakingToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      expect(await staking.getUserStake(user1.address)).to.equal(stakeAmount);
      expect(await staking.totalStaked()).to.equal(stakeAmount);
    });

    it("Should emit Staked event", async function () {
      const { staking, stakingToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);

      await expect(staking.connect(user1).stake(stakeAmount))
        .to.emit(staking, "Staked")
        .withArgs(user1.address, stakeAmount, 0);
    });

    it("Should allow multiple stakes", async function () {
      const { staking, stakingToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount1 = ethers.parseUnits("1000", 18);
      const stakeAmount2 = ethers.parseUnits("500", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount1 + stakeAmount2);
      
      await staking.connect(user1).stake(stakeAmount1);
      await staking.connect(user1).stake(stakeAmount2);

      expect(await staking.getUserStake(user1.address)).to.equal(stakeAmount1 + stakeAmount2);
    });

    it("Should revert when staking zero amount", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      await expect(staking.connect(user1).stake(0))
        .to.be.revertedWithCustomError(staking, "ZeroAmount");
    });

    it("Should revert when staking without approval", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      await expect(staking.connect(user1).stake(stakeAmount))
        .to.be.reverted;
    });
  });

  describe("Rewards", function () {
    it("Should calculate rewards correctly over time", async function () {
      const { staking, stakingToken, rewardToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      // Approve and stake
      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      // Fast forward 1 year (365 days)
      await time.increase(365 * 24 * 60 * 60);

      // Calculate expected reward: 1000 * 0.1 = 100 tokens
      const pendingReward = await staking.getPendingReward(user1.address);
      
      // Should be approximately 100 tokens (within 1% tolerance for rounding)
      expect(pendingReward).to.be.closeTo(
        ethers.parseUnits("100", 18),
        ethers.parseUnits("1", 18)
      );
    });

    it("Should allow users to claim rewards", async function () {
      const { staking, stakingToken, rewardToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      // Fast forward 1 year
      await time.increase(365 * 24 * 60 * 60);

      const balanceBefore = await rewardToken.balanceOf(user1.address);
      await staking.connect(user1).claimRewards();
      const balanceAfter = await rewardToken.balanceOf(user1.address);

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should emit RewardClaimed event", async function () {
      const { staking, stakingToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await time.increase(365 * 24 * 60 * 60);

      await expect(staking.connect(user1).claimRewards())
        .to.emit(staking, "RewardClaimed");
    });

    it("Should return zero rewards for zero stake", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);

      expect(await staking.getPendingReward(user1.address)).to.equal(0);
    });
  });

  describe("Withdrawal", function () {
    it("Should allow users to withdraw staked tokens", async function () {
      const { staking, stakingToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      const balanceBefore = await stakingToken.balanceOf(user1.address);
      await staking.connect(user1).withdraw(stakeAmount);
      const balanceAfter = await stakingToken.balanceOf(user1.address);

      expect(balanceAfter - balanceBefore).to.equal(stakeAmount);
      expect(await staking.getUserStake(user1.address)).to.equal(0);
    });

    it("Should emit Withdrawn event", async function () {
      const { staking, stakingToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await expect(staking.connect(user1).withdraw(stakeAmount))
        .to.emit(staking, "Withdrawn")
        .withArgs(user1.address, stakeAmount);
    });

    it("Should revert when withdrawing more than staked", async function () {
      const { staking, stakingToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await expect(staking.connect(user1).withdraw(stakeAmount + 1n))
        .to.be.revertedWithCustomError(staking, "InsufficientBalance");
    });

    it("Should allow partial withdrawal", async function () {
      const { staking, stakingToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);
      const withdrawAmount = ethers.parseUnits("300", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await staking.connect(user1).withdraw(withdrawAmount);

      expect(await staking.getUserStake(user1.address)).to.equal(stakeAmount - withdrawAmount);
    });
  });

  describe("Lock Period", function () {
    it("Should prevent withdrawal during lock period", async function () {
      const [owner, user1] = await hre.ethers.getSigners();

      const Token = await ethers.getContractFactory("Yaroslav");
      const stakingToken = await Token.deploy(ethers.parseUnits("1000000", 18));
      const rewardToken = await Token.deploy(ethers.parseUnits("1000000", 18));

      await stakingToken.waitForDeployment();
      await rewardToken.waitForDeployment();

      // Deploy with 7 day lock period
      const StakingContract = await ethers.getContractFactory("StakingContract");
      const staking = await StakingContract.deploy(
        await stakingToken.getAddress(),
        await rewardToken.getAddress(),
        ethers.parseUnits("0.1", 18),
        7 * 24 * 60 * 60 // 7 days
      );

      await staking.waitForDeployment();

      await stakingToken.transfer(user1.address, ethers.parseUnits("10000", 18));
      await rewardToken.transfer(await staking.getAddress(), ethers.parseUnits("100000", 18));

      const stakeAmount = ethers.parseUnits("1000", 18);
      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      // Try to withdraw immediately (should fail)
      await expect(staking.connect(user1).withdraw(stakeAmount))
        .to.be.revertedWithCustomError(staking, "TokensLocked");

      // Fast forward past lock period
      await time.increase(7 * 24 * 60 * 60 + 1);

      // Now should be able to withdraw
      await expect(staking.connect(user1).withdraw(stakeAmount))
        .to.not.be.reverted;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update reward rate", async function () {
      const { staking, owner } = await loadFixture(deployStakingFixture);
      const newRate = ethers.parseUnits("0.2", 18); // 20% APR

      await expect(staking.connect(owner).setRewardRate(newRate))
        .to.emit(staking, "RewardRateUpdated");

      expect(await staking.rewardRate()).to.equal(newRate);
    });

    it("Should prevent non-owner from updating reward rate", async function () {
      const { staking, user1 } = await loadFixture(deployStakingFixture);
      const newRate = ethers.parseUnits("0.2", 18);

      await expect(staking.connect(user1).setRewardRate(newRate))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert when setting invalid reward rate", async function () {
      const { staking, owner } = await loadFixture(deployStakingFixture);
      const invalidRate = ethers.parseUnits("1.1", 18); // > 100%

      await expect(staking.connect(owner).setRewardRate(invalidRate))
        .to.be.revertedWithCustomError(staking, "InvalidRewardRate");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero reward rate", async function () {
      const { staking, stakingToken, user1 } = await loadFixture(deployStakingFixture);
      const stakeAmount = ethers.parseUnits("1000", 18);

      // Set reward rate to zero
      await staking.setRewardRate(0);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await time.increase(365 * 24 * 60 * 60);

      expect(await staking.getPendingReward(user1.address)).to.equal(0);
    });

    it("Should handle multiple users staking", async function () {
      const { staking, stakingToken, user1, user2 } = await loadFixture(deployStakingFixture);
      const stakeAmount1 = ethers.parseUnits("1000", 18);
      const stakeAmount2 = ethers.parseUnits("2000", 18);

      await stakingToken.connect(user1).approve(await staking.getAddress(), stakeAmount1);
      await stakingToken.connect(user2).approve(await staking.getAddress(), stakeAmount2);

      await staking.connect(user1).stake(stakeAmount1);
      await staking.connect(user2).stake(stakeAmount2);

      expect(await staking.totalStaked()).to.equal(stakeAmount1 + stakeAmount2);
      expect(await staking.getUserStake(user1.address)).to.equal(stakeAmount1);
      expect(await staking.getUserStake(user2.address)).to.equal(stakeAmount2);
    });
  });
});

