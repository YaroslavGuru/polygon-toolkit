// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title UpgradeableERC20V1
 * @dev Upgradeable ERC20 token using UUPS (Universal Upgradeable Proxy Standard) pattern
 * 
 * Features:
 * - UUPS upgradeable pattern
 * - Ownable access control
 * - Pausable functionality
 * - Initial supply minting
 * 
 * Security:
 * - Only owner can upgrade
 * - Prevents reinitialization attacks
 * - Storage layout compatible for future upgrades
 */
contract UpgradeableERC20V1 is
    Initializable,
    ERC20Upgradeable,
    ERC20PausableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply
     * @param owner Owner address
     */
    function initialize(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) public initializer {
        __ERC20_init(name, symbol);
        __ERC20Pausable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        // Transfer ownership to specified owner
        _transferOwnership(owner);
        
        // Mint initial supply to owner
        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
    }

    /**
     * @dev Pauses all token transfers
     * Only callable by owner
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers
     * Only callable by owner
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Authorizes an upgrade
     * Only callable by owner
     * @param newImplementation Address of the new implementation contract
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyOwner
    {}

    /**
     * @dev Hook that is called before any transfer of tokens
     * Includes minting and burning
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        super._update(from, to, amount);
    }

    /**
     * @dev Returns the current implementation version
     * This function will be overridden in V2
     */
    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }
}

