import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";

/**
 * @dev Comprehensive test suite for upgradeable ERC20 token
 * 
 * Tests cover:
 * - Deployment and initialization
 * - Owner verification
 * - Upgrade from v1 to v2
 * - Storage preservation during upgrades
 * - Permission control (non-owner cannot upgrade)
 * - Reinitialization attack prevention
 */
describe("UpgradeableERC20", function () {
  // Fixture to deploy v1 contract
  async function deployV1Fixture() {
    const [owner, user1, user2] = await hre.ethers.getSigners();

    const tokenName = "Yaroslav";
    const tokenSymbol = "YARO";
    const initialSupply = ethers.parseUnits("1000000", 18); // 1M tokens

    const UpgradeableERC20 = await ethers.getContractFactory("UpgradeableERC20");
    const token = await upgrades.deployProxy(
      UpgradeableERC20,
      [tokenName, tokenSymbol, initialSupply, owner.address],
      { 
        initializer: "initialize",
        kind: "uups"
      }
    );

    await token.waitForDeployment();
    const proxyAddress = await token.getAddress();

    return { token, proxyAddress, owner, user1, user2, tokenName, tokenSymbol, initialSupply };
  }

  describe("Deployment", function () {
    it("Should deploy proxy and implementation correctly", async function () {
      const { token, proxyAddress, owner } = await loadFixture(deployV1Fixture);

      expect(proxyAddress).to.be.properAddress;
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct parameters", async function () {
      const { token, tokenName, tokenSymbol, initialSupply, owner } = await loadFixture(deployV1Fixture);

      expect(await token.name()).to.equal(tokenName);
      expect(await token.symbol()).to.equal(tokenSymbol);
      expect(await token.totalSupply()).to.equal(initialSupply);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should set the correct owner", async function () {
      const { token, owner } = await loadFixture(deployV1Fixture);

      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should prevent reinitialization attack", async function () {
      const { token, owner, user1 } = await loadFixture(deployV1Fixture);

      // Attempt to reinitialize (should fail)
      await expect(
        token.initialize("Hacked", "HACK", ethers.parseUnits("1000000", 18), user1.address)
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("ERC20 Functionality", function () {
    it("Should transfer tokens correctly", async function () {
      const { token, owner, user1 } = await loadFixture(deployV1Fixture);
      const transferAmount = ethers.parseUnits("100", 18);
      const initialSupply = ethers.parseUnits("1000000", 18);

      await token.transfer(user1.address, transferAmount);

      expect(await token.balanceOf(user1.address)).to.equal(transferAmount);
      expect(await token.balanceOf(owner.address)).to.equal(
        initialSupply - transferAmount
      );
    });

    it("Should allow owner to mint tokens", async function () {
      const { token, owner, user1 } = await loadFixture(deployV1Fixture);
      const mintAmount = ethers.parseUnits("50000", 18);

      await token.mint(user1.address, mintAmount);

      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(
        ethers.parseUnits("1050000", 18)
      );
    });

    it("Should prevent non-owner from minting", async function () {
      const { token, user1 } = await loadFixture(deployV1Fixture);
      const mintAmount = ethers.parseUnits("50000", 18);

      await expect(
        token.connect(user1).mint(user1.address, mintAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow users to burn their own tokens", async function () {
      const { token, owner } = await loadFixture(deployV1Fixture);
      const burnAmount = ethers.parseUnits("100000", 18);

      await token.burn(burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(
        ethers.parseUnits("900000", 18)
      );
      expect(await token.totalSupply()).to.equal(
        ethers.parseUnits("900000", 18)
      );
    });
  });

  describe("Upgrade to V2", function () {
    it("Should upgrade from v1 to v2 successfully", async function () {
      const { token, proxyAddress, owner, user1 } = await loadFixture(deployV1Fixture);

      // Perform some operations before upgrade
      const transferAmount = ethers.parseUnits("100", 18);
      await token.transfer(user1.address, transferAmount);

      // Store state before upgrade
      const ownerBalanceBefore = await token.balanceOf(owner.address);
      const user1BalanceBefore = await token.balanceOf(user1.address);
      const totalSupplyBefore = await token.totalSupply();
      const nameBefore = await token.name();
      const symbolBefore = await token.symbol();

      // Upgrade to v2
      const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");
      const upgradedToken = await upgrades.upgradeProxy(
        proxyAddress,
        UpgradeableERC20V2,
        { kind: "uups" }
      );

      await upgradedToken.waitForDeployment();

      // Verify proxy address unchanged
      expect(await upgradedToken.getAddress()).to.equal(proxyAddress);

      // Verify storage preservation
      expect(await upgradedToken.balanceOf(owner.address)).to.equal(ownerBalanceBefore);
      expect(await upgradedToken.balanceOf(user1.address)).to.equal(user1BalanceBefore);
      expect(await upgradedToken.totalSupply()).to.equal(totalSupplyBefore);
      expect(await upgradedToken.name()).to.equal(nameBefore);
      expect(await upgradedToken.symbol()).to.equal(symbolBefore);
      expect(await upgradedToken.owner()).to.equal(owner.address);
    });

    it("Should preserve all balances after upgrade", async function () {
      const { token, proxyAddress, owner, user1, user2 } = await loadFixture(deployV1Fixture);

      // Create multiple transfers
      await token.transfer(user1.address, ethers.parseUnits("100", 18));
      await token.transfer(user2.address, ethers.parseUnits("200", 18));
      await token.connect(user1).transfer(user2.address, ethers.parseUnits("50", 18));

      // Store all balances
      const balances = {
        owner: await token.balanceOf(owner.address),
        user1: await token.balanceOf(user1.address),
        user2: await token.balanceOf(user2.address),
      };

      // Upgrade
      const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");
      const upgradedToken = await upgrades.upgradeProxy(
        proxyAddress,
        UpgradeableERC20V2,
        { kind: "uups" }
      );

      // Verify all balances preserved
      expect(await upgradedToken.balanceOf(owner.address)).to.equal(balances.owner);
      expect(await upgradedToken.balanceOf(user1.address)).to.equal(balances.user1);
      expect(await upgradedToken.balanceOf(user2.address)).to.equal(balances.user2);
    });

    it("Should have v2 features after upgrade", async function () {
      const { token, proxyAddress } = await loadFixture(deployV1Fixture);

      // Upgrade to v2
      const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");
      const upgradedToken = await upgrades.upgradeProxy(
        proxyAddress,
        UpgradeableERC20V2,
        { kind: "uups" }
      );

      // Test v2 features
      expect(await upgradedToken.version()).to.equal("2.0.0");
      expect(await upgradedToken.getLastTransferTimestamp(ethers.ZeroAddress)).to.equal(0);
    });

    it("Should track transfer timestamps in v2", async function () {
      const { token, proxyAddress, owner, user1 } = await loadFixture(deployV1Fixture);

      // Upgrade to v2 first
      const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");
      const upgradedToken = await upgrades.upgradeProxy(
        proxyAddress,
        UpgradeableERC20V2,
        { kind: "uups" }
      );

      // Perform transfer
      const transferAmount = ethers.parseUnits("100", 18);
      const tx = await upgradedToken.transfer(user1.address, transferAmount);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      // Check timestamps
      const ownerTimestamp = await upgradedToken.getLastTransferTimestamp(owner.address);
      const user1Timestamp = await upgradedToken.getLastTransferTimestamp(user1.address);

      expect(ownerTimestamp).to.be.greaterThan(0);
      expect(user1Timestamp).to.be.greaterThan(0);
      expect(ownerTimestamp).to.equal(user1Timestamp);
      // Timestamp should be approximately equal to block timestamp
      expect(ownerTimestamp).to.be.closeTo(block!.timestamp, 5);
    });
  });

  describe("Permission Control", function () {
    it("Should prevent non-owner from upgrading", async function () {
      const { token, proxyAddress, user1 } = await loadFixture(deployV1Fixture);

      const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");

      // Attempt upgrade from non-owner account
      await expect(
        upgrades.upgradeProxy(
          proxyAddress,
          UpgradeableERC20V2.connect(user1),
          { kind: "uups" }
        )
      ).to.be.reverted;
    });

    it("Should allow owner to upgrade", async function () {
      const { token, proxyAddress, owner } = await loadFixture(deployV1Fixture);

      const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");

      // Owner should be able to upgrade
      await expect(
        upgrades.upgradeProxy(
          proxyAddress,
          UpgradeableERC20V2,
          { kind: "uups" }
        )
      ).to.not.be.reverted;
    });
  });

  describe("Storage Layout Safety", function () {
    it("Should maintain storage layout after upgrade", async function () {
      const { token, proxyAddress, owner, user1 } = await loadFixture(deployV1Fixture);

      // Create state before upgrade
      await token.transfer(user1.address, ethers.parseUnits("100", 18));
      await token.mint(owner.address, ethers.parseUnits("50000", 18));

      const stateBefore = {
        ownerBalance: await token.balanceOf(owner.address),
        user1Balance: await token.balanceOf(user1.address),
        totalSupply: await token.totalSupply(),
        owner: await token.owner(),
        name: await token.name(),
        symbol: await token.symbol(),
      };

      // Upgrade
      const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");
      const upgradedToken = await upgrades.upgradeProxy(
        proxyAddress,
        UpgradeableERC20V2,
        { kind: "uups" }
      );

      // Verify all state preserved
      expect(await upgradedToken.balanceOf(owner.address)).to.equal(stateBefore.ownerBalance);
      expect(await upgradedToken.balanceOf(user1.address)).to.equal(stateBefore.user1Balance);
      expect(await upgradedToken.totalSupply()).to.equal(stateBefore.totalSupply);
      expect(await upgradedToken.owner()).to.equal(stateBefore.owner);
      expect(await upgradedToken.name()).to.equal(stateBefore.name);
      expect(await upgradedToken.symbol()).to.equal(stateBefore.symbol);
    });
  });

  describe("Implementation Address Verification", function () {
    it("Should have different implementation addresses for v1 and v2", async function () {
      const { proxyAddress } = await loadFixture(deployV1Fixture);

      // Get v1 implementation
      const v1Implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

      // Upgrade to v2
      const UpgradeableERC20V2 = await ethers.getContractFactory("UpgradeableERC20V2");
      await upgrades.upgradeProxy(
        proxyAddress,
        UpgradeableERC20V2,
        { kind: "uups" }
      );

      // Get v2 implementation
      const v2Implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

      // Implementation addresses should be different
      expect(v1Implementation).to.not.equal(v2Implementation);
      expect(v2Implementation).to.be.properAddress;
    });
  });
});

