import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";

/**
 * @dev Comprehensive test suite for VestingContract
 * 
 * Tests cover:
 * - Vesting schedule creation
 * - Claiming before, during, and after vesting
 * - Cliff period enforcement
 * - Linear vesting calculations
 * - Multiple beneficiaries
 * - Edge cases and security
 */
describe("VestingContract", function () {
  // Fixture to deploy contracts
  async function deployVestingFixture() {
    const [owner, beneficiary1, beneficiary2] = await hre.ethers.getSigners();

    // Deploy test token
    const Token = await ethers.getContractFactory("Yaroslav");
    const vestingToken = await Token.deploy(ethers.parseUnits("1000000", 18));

    await vestingToken.waitForDeployment();

    // Deploy vesting contract
    const VestingContract = await ethers.getContractFactory("VestingContract");
    const vesting = await VestingContract.deploy(await vestingToken.getAddress());

    await vesting.waitForDeployment();

    // Fund owner with tokens
    await vestingToken.transfer(owner.address, ethers.parseUnits("100000", 18));

    return {
      vesting,
      vestingToken,
      owner,
      beneficiary1,
      beneficiary2,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct token address", async function () {
      const { vesting, vestingToken } = await loadFixture(deployVestingFixture);

      expect(await vesting.vestingToken()).to.equal(await vestingToken.getAddress());
    });

    it("Should set owner correctly", async function () {
      const { vesting, owner } = await loadFixture(deployVestingFixture);

      expect(await vesting.owner()).to.equal(owner.address);
    });
  });

  describe("Vesting Creation", function () {
    it("Should create a vesting schedule", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest()) + 1n;
      const cliffDuration = 30 * 24 * 60 * 60; // 30 days
      const vestingDuration = 365 * 24 * 60 * 60; // 1 year

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      await expect(vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      ))
        .to.emit(vesting, "VestingCreated");

      expect(await vesting.vestingScheduleCount()).to.equal(1);
    });

    it("Should revert when creating vesting with zero amount", async function () {
      const { vesting, beneficiary1 } = await loadFixture(deployVestingFixture);
      const cliffDuration = 30 * 24 * 60 * 60;
      const vestingDuration = 365 * 24 * 60 * 60;

      await expect(vesting.createVesting(
        beneficiary1.address,
        0,
        0,
        cliffDuration,
        vestingDuration
      ))
        .to.be.revertedWithCustomError(vesting, "ZeroAmount");
    });

    it("Should revert when creating vesting with invalid beneficiary", async function () {
      const { vesting, vestingToken, owner } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const cliffDuration = 30 * 24 * 60 * 60;
      const vestingDuration = 365 * 24 * 60 * 60;

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      await expect(vesting.createVesting(
        ethers.ZeroAddress,
        vestingAmount,
        0,
        cliffDuration,
        vestingDuration
      ))
        .to.be.revertedWithCustomError(vesting, "InvalidVestingParameters");
    });

    it("Should revert when cliff duration exceeds vesting duration", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const cliffDuration = 365 * 24 * 60 * 60; // 1 year
      const vestingDuration = 30 * 24 * 60 * 60; // 30 days (less than cliff)

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      await expect(vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        0,
        cliffDuration,
        vestingDuration
      ))
        .to.be.revertedWithCustomError(vesting, "InvalidVestingParameters");
    });
  });

  describe("Cliff Period", function () {
    it("Should prevent claiming before cliff", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 30 * 24 * 60 * 60; // 30 days
      const vestingDuration = 365 * 24 * 60 * 60; // 1 year

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      // Try to claim before cliff (should fail)
      await expect(vesting.connect(beneficiary1).claim(scheduleId))
        .to.be.revertedWithCustomError(vesting, "NothingToClaim");

      // Fast forward past cliff
      await time.increase(30 * 24 * 60 * 60 + 1);

      // Now should be able to claim
      await expect(vesting.connect(beneficiary1).claim(scheduleId))
        .to.not.be.reverted;
    });

    it("Should allow claiming at cliff", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 30 * 24 * 60 * 60; // 30 days
      const vestingDuration = 365 * 24 * 60 * 60; // 1 year

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      // Fast forward to cliff
      await time.increase(30 * 24 * 60 * 60);

      const claimable = await vesting.getClaimableAmount(scheduleId);
      expect(claimable).to.be.greaterThan(0);
    });
  });

  describe("Linear Vesting", function () {
    it("Should calculate vested amount correctly", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0; // No cliff
      const vestingDuration = 365 * 24 * 60 * 60; // 1 year

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      // Fast forward 6 months (50% should be vested)
      await time.increase(182 * 24 * 60 * 60);

      const vested = await vesting.getVestedAmount(scheduleId);
      // Should be approximately 50% (within 1% tolerance)
      expect(vested).to.be.closeTo(
        ethers.parseUnits("5000", 18),
        ethers.parseUnits("100", 18)
      );
    });

    it("Should fully vest after duration", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0;
      const vestingDuration = 365 * 24 * 60 * 60; // 1 year

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      // Fast forward past vesting duration
      await time.increase(365 * 24 * 60 * 60 + 1);

      const vested = await vesting.getVestedAmount(scheduleId);
      expect(vested).to.equal(vestingAmount);
    });
  });

  describe("Claiming", function () {
    it("Should allow beneficiary to claim vested tokens", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0;
      const vestingDuration = 365 * 24 * 60 * 60; // 1 year

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      // Fast forward 6 months
      await time.increase(182 * 24 * 60 * 60);

      const balanceBefore = await vestingToken.balanceOf(beneficiary1.address);
      await vesting.connect(beneficiary1).claim(scheduleId);
      const balanceAfter = await vestingToken.balanceOf(beneficiary1.address);

      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should emit Claimed event", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0;
      const vestingDuration = 365 * 24 * 60 * 60;

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      await time.increase(182 * 24 * 60 * 60);

      await expect(vesting.connect(beneficiary1).claim(scheduleId))
        .to.emit(vesting, "Claimed");
    });

    it("Should prevent non-beneficiary from claiming", async function () {
      const { vesting, vestingToken, owner, beneficiary1, beneficiary2 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0;
      const vestingDuration = 365 * 24 * 60 * 60;

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      await time.increase(182 * 24 * 60 * 60);

      await expect(vesting.connect(beneficiary2).claim(scheduleId))
        .to.be.revertedWith("VestingContract: not beneficiary");
    });

    it("Should allow claiming multiple times", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0;
      const vestingDuration = 365 * 24 * 60 * 60;

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      // First claim after 3 months
      await time.increase(90 * 24 * 60 * 60);
      await vesting.connect(beneficiary1).claim(scheduleId);

      // Second claim after another 3 months
      await time.increase(90 * 24 * 60 * 60);
      await expect(vesting.connect(beneficiary1).claim(scheduleId))
        .to.not.be.reverted;
    });

    it("Should allow claiming all schedules at once", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount1 = ethers.parseUnits("10000", 18);
      const vestingAmount2 = ethers.parseUnits("5000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0;
      const vestingDuration = 365 * 24 * 60 * 60;

      await vestingToken.approve(await vesting.getAddress(), vestingAmount1 + vestingAmount2);

      await vesting.createVesting(
        beneficiary1.address,
        vestingAmount1,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      await vesting.createVesting(
        beneficiary1.address,
        vestingAmount2,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      await time.increase(182 * 24 * 60 * 60);

      await expect(vesting.connect(beneficiary1).claimAll())
        .to.not.be.reverted;
    });
  });

  describe("Revocation", function () {
    it("Should allow owner to revoke vesting", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0;
      const vestingDuration = 365 * 24 * 60 * 60;

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      await expect(vesting.revokeVesting(scheduleId))
        .to.emit(vesting, "VestingRevoked");
    });

    it("Should prevent claiming after revocation", async function () {
      const { vesting, vestingToken, owner, beneficiary1 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0;
      const vestingDuration = 365 * 24 * 60 * 60;

      await vestingToken.approve(await vesting.getAddress(), vestingAmount);

      const tx = await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "VestingCreated"
      );
      const scheduleId = event?.args?.[0];

      await vesting.revokeVesting(scheduleId);

      await expect(vesting.connect(beneficiary1).claim(scheduleId))
        .to.be.revertedWithCustomError(vesting, "VestingAlreadyRevoked");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple beneficiaries", async function () {
      const { vesting, vestingToken, owner, beneficiary1, beneficiary2 } = await loadFixture(deployVestingFixture);
      const vestingAmount = ethers.parseUnits("10000", 18);
      const startTime = BigInt(await time.latest());
      const cliffDuration = 0;
      const vestingDuration = 365 * 24 * 60 * 60;

      await vestingToken.approve(await vesting.getAddress(), vestingAmount * 2n);

      await vesting.createVesting(
        beneficiary1.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      await vesting.createVesting(
        beneficiary2.address,
        vestingAmount,
        Number(startTime),
        cliffDuration,
        vestingDuration
      );

      expect(await vesting.vestingScheduleCount()).to.equal(2);
    });

    it("Should return zero for non-existent schedule", async function () {
      const { vesting } = await loadFixture(deployVestingFixture);
      const fakeScheduleId = ethers.id("fake");

      expect(await vesting.getVestedAmount(fakeScheduleId)).to.equal(0);
      expect(await vesting.getClaimableAmount(fakeScheduleId)).to.equal(0);
    });
  });
});

