import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("UpgradeableERC20 - Upgrade Safety and Permission Control", function () {
  let upgradeableERC20V1: Contract;
  let upgradeableERC20V2: Contract;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;

  const TOKEN_NAME = "Upgradeable Token";
  const TOKEN_SYMBOL = "UPT";
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18); // 1M tokens

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy V1 implementation
    const UpgradeableERC20V1 = await ethers.getContractFactory(
      "UpgradeableERC20V1"
    );

    // Deploy as UUPS proxy
    upgradeableERC20V1 = await upgrades.deployProxy(
      UpgradeableERC20V1,
      [TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY, owner.address],
      { initializer: "initialize" }
    );

    await upgradeableERC20V1.waitForDeployment();
  });

  describe("Deployment and Initialization", function () {
    it("Should deploy proxy successfully", async function () {
      expect(upgradeableERC20V1.target).to.be.properAddress;
    });

    it("Should initialize with correct parameters", async function () {
      expect(await upgradeableERC20V1.name()).to.equal(TOKEN_NAME);
      expect(await upgradeableERC20V1.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await upgradeableERC20V1.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should set owner correctly", async function () {
      expect(await upgradeableERC20V1.owner()).to.equal(owner.address);
    });

    it("Should mint initial supply to owner", async function () {
      expect(await upgradeableERC20V1.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY
      );
    });

    it("Should return version 1.0.0", async function () {
      expect(await upgradeableERC20V1.version()).to.equal("1.0.0");
    });

    it("Should prevent reinitialization", async function () {
      await expect(
        upgradeableERC20V1.initialize(
          TOKEN_NAME,
          TOKEN_SYMBOL,
          INITIAL_SUPPLY,
          owner.address
        )
      ).to.be.revertedWithCustomError(
        upgradeableERC20V1,
        "InvalidInitialization"
      );
    });
  });

  describe("Basic ERC20 Functionality", function () {
    it("Should transfer tokens correctly", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      await upgradeableERC20V1.transfer(user1.address, transferAmount);

      expect(await upgradeableERC20V1.balanceOf(user1.address)).to.equal(
        transferAmount
      );
      expect(await upgradeableERC20V1.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY - transferAmount
      );
    });

    it("Should allow approval and transferFrom", async function () {
      const approveAmount = ethers.parseUnits("50", 18);
      await upgradeableERC20V1.approve(user1.address, approveAmount);

      expect(
        await upgradeableERC20V1.allowance(owner.address, user1.address)
      ).to.equal(approveAmount);

      await upgradeableERC20V1
        .connect(user1)
        .transferFrom(owner.address, user2.address, approveAmount);

      expect(await upgradeableERC20V1.balanceOf(user2.address)).to.equal(
        approveAmount
      );
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause", async function () {
      await upgradeableERC20V1.pause();
      expect(await upgradeableERC20V1.paused()).to.be.true;
    });

    it("Should prevent transfers when paused", async function () {
      await upgradeableERC20V1.pause();
      const transferAmount = ethers.parseUnits("100", 18);

      await expect(
        upgradeableERC20V1.transfer(user1.address, transferAmount)
      ).to.be.revertedWithCustomError(
        upgradeableERC20V1,
        "EnforcedPause"
      );
    });

    it("Should allow owner to unpause", async function () {
      await upgradeableERC20V1.pause();
      await upgradeableERC20V1.unpause();
      expect(await upgradeableERC20V1.paused()).to.be.false;

      // Should be able to transfer after unpause
      const transferAmount = ethers.parseUnits("100", 18);
      await upgradeableERC20V1.transfer(user1.address, transferAmount);
      expect(await upgradeableERC20V1.balanceOf(user1.address)).to.equal(
        transferAmount
      );
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(
        upgradeableERC20V1.connect(user1).pause()
      ).to.be.revertedWithCustomError(upgradeableERC20V1, "OwnableUnauthorizedAccount");
    });
  });

  describe("Upgrade to V2", function () {
    beforeEach(async function () {
      // Perform some operations to test storage preservation
      const transferAmount = ethers.parseUnits("100000", 18);
      await upgradeableERC20V1.transfer(user1.address, transferAmount);
      await upgradeableERC20V1.transfer(user2.address, transferAmount);

      // Deploy V2 implementation
      const UpgradeableERC20V2 = await ethers.getContractFactory(
        "UpgradeableERC20V2"
      );

      // Upgrade proxy to V2
      upgradeableERC20V2 = await upgrades.upgradeProxy(
        upgradeableERC20V1.target,
        UpgradeableERC20V2
      );

      await upgradeableERC20V2.waitForDeployment();
    });

    it("Should upgrade to V2 successfully", async function () {
      expect(upgradeableERC20V2.target).to.equal(upgradeableERC20V1.target);
    });

    it("Should preserve storage after upgrade", async function () {
      // Token name and symbol should be preserved
      expect(await upgradeableERC20V2.name()).to.equal(TOKEN_NAME);
      expect(await upgradeableERC20V2.symbol()).to.equal(TOKEN_SYMBOL);

      // Total supply should be preserved
      expect(await upgradeableERC20V2.totalSupply()).to.equal(INITIAL_SUPPLY);

      // Balances should be preserved
      expect(await upgradeableERC20V2.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY - ethers.parseUnits("200000", 18)
      );
      expect(await upgradeableERC20V2.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("100000", 18)
      );
      expect(await upgradeableERC20V2.balanceOf(user2.address)).to.equal(
        ethers.parseUnits("100000", 18)
      );

      // Owner should be preserved
      expect(await upgradeableERC20V2.owner()).to.equal(owner.address);
    });

    it("Should return version 2.0.0", async function () {
      expect(await upgradeableERC20V2.version()).to.equal("2.0.0");
    });

    it("Should have new V2 functions", async function () {
      const metadata = await upgradeableERC20V2.getMetadata();
      expect(metadata[0]).to.equal(TOKEN_NAME);
      expect(metadata[1]).to.equal(TOKEN_SYMBOL);
      expect(metadata[2]).to.equal(INITIAL_SUPPLY);
      expect(metadata[3]).to.equal("2.0.0");
    });

    it("Should allow batch transfer in V2", async function () {
      const recipients = [user1.address, user2.address, user3.address];
      const amounts = [
        ethers.parseUnits("1000", 18),
        ethers.parseUnits("2000", 18),
        ethers.parseUnits("3000", 18),
      ];

      const ownerBalanceBefore = await upgradeableERC20V2.balanceOf(
        owner.address
      );

      await upgradeableERC20V2.batchTransfer(recipients, amounts);

      expect(await upgradeableERC20V2.balanceOf(user1.address)).to.equal(
        ethers.parseUnits("101000", 18) // 100000 + 1000
      );
      expect(await upgradeableERC20V2.balanceOf(user2.address)).to.equal(
        ethers.parseUnits("102000", 18) // 100000 + 2000
      );
      expect(await upgradeableERC20V2.balanceOf(user3.address)).to.equal(
        ethers.parseUnits("3000", 18)
      );

      const totalTransferred = amounts.reduce(
        (sum, amount) => sum + amount,
        0n
      );
      expect(await upgradeableERC20V2.balanceOf(owner.address)).to.equal(
        ownerBalanceBefore - totalTransferred
      );
    });

    it("Should maintain ERC20 functionality after upgrade", async function () {
      const transferAmount = ethers.parseUnits("500", 18);
      await upgradeableERC20V2.transfer(user3.address, transferAmount);

      expect(await upgradeableERC20V2.balanceOf(user3.address)).to.equal(
        transferAmount
      );
    });

    it("Should maintain pausable functionality after upgrade", async function () {
      await upgradeableERC20V2.pause();
      expect(await upgradeableERC20V2.paused()).to.be.true;

      await upgradeableERC20V2.unpause();
      expect(await upgradeableERC20V2.paused()).to.be.false;
    });
  });

  describe("Permission Control - Upgrade Authorization", function () {
    it("Should prevent non-owner from upgrading", async function () {
      const UpgradeableERC20V2 = await ethers.getContractFactory(
        "UpgradeableERC20V2"
      );

      // Attempt to upgrade as non-owner should fail
      // Note: upgrades.upgradeProxy uses msg.sender, so we need to test differently
      // We'll test by attempting to call _authorizeUpgrade indirectly through upgradeTo
      const proxyAddress = upgradeableERC20V1.target;
      const v2Address = await UpgradeableERC20V2.getDeploymentTransaction()
        .then((tx) => {
          // Get the contract address that would be deployed
          return ethers.getContractAt("UpgradeableERC20V2", proxyAddress);
        })
        .catch(() => null);

      // The upgrade should fail because user1 is not the owner
      // We test this by checking that upgradeTo would revert
      const proxy = await ethers.getContractAt(
        "UUPSUpgradeable",
        proxyAddress
      );

      // Deploy V2 implementation first
      const v2Implementation = await UpgradeableERC20V2.deploy();
      await v2Implementation.waitForDeployment();

      // Attempt upgrade as non-owner should fail
      // Note: upgradeTo is not directly callable, but _authorizeUpgrade will check owner
      // We can test this by trying to upgrade through the proxy's upgradeTo function
      // However, UUPS pattern requires the implementation to have upgradeToAndCall
      // Let's test by attempting to call upgradeTo on the implementation (which should fail)
      await expect(
        upgradeableERC20V1
          .connect(user1)
          .upgradeToAndCall(v2Implementation.target, "0x")
      ).to.be.revertedWithCustomError(
        upgradeableERC20V1,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should allow owner to upgrade", async function () {
      const UpgradeableERC20V2 = await ethers.getContractFactory(
        "UpgradeableERC20V2"
      );

      // Owner should be able to upgrade
      const upgraded = await upgrades.upgradeProxy(
        upgradeableERC20V1.target,
        UpgradeableERC20V2
      );

      expect(upgraded.target).to.equal(upgradeableERC20V1.target);
      expect(await upgraded.version()).to.equal("2.0.0");
    });
  });

  describe("Storage Layout Consistency", function () {
    it("Should maintain all state variables after upgrade", async function () {
      // Set up state in V1
      await upgradeableERC20V1.transfer(user1.address, ethers.parseUnits("100", 18));
      await upgradeableERC20V1.pause();

      const ownerBefore = await upgradeableERC20V1.owner();
      const totalSupplyBefore = await upgradeableERC20V1.totalSupply();
      const ownerBalanceBefore = await upgradeableERC20V1.balanceOf(owner.address);
      const user1BalanceBefore = await upgradeableERC20V1.balanceOf(user1.address);
      const pausedBefore = await upgradeableERC20V1.paused();

      // Upgrade to V2
      const UpgradeableERC20V2 = await ethers.getContractFactory(
        "UpgradeableERC20V2"
      );
      upgradeableERC20V2 = await upgrades.upgradeProxy(
        upgradeableERC20V1.target,
        UpgradeableERC20V2
      );

      // Verify all state is preserved
      expect(await upgradeableERC20V2.owner()).to.equal(ownerBefore);
      expect(await upgradeableERC20V2.totalSupply()).to.equal(totalSupplyBefore);
      expect(await upgradeableERC20V2.balanceOf(owner.address)).to.equal(ownerBalanceBefore);
      expect(await upgradeableERC20V2.balanceOf(user1.address)).to.equal(user1BalanceBefore);
      expect(await upgradeableERC20V2.paused()).to.equal(pausedBefore);
    });
  });
});

