// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title UpgradeableERC20
 * @dev Upgradeable ERC20 token implementation using UUPS (Universal Upgradeable Proxy Standard) pattern
 * @notice This contract can be upgraded by the owner without redeploying the entire system
 * 
 * Security Features:
 * - Only owner can upgrade the contract
 * - Prevents reinitialization attacks
 * - Maintains storage layout consistency for safe upgrades
 */
contract UpgradeableERC20 is 
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    /// @dev Custom error for unauthorized upgrade attempts
    error UnauthorizedUpgrade();

    /// @dev Custom error for invalid initialization
    error InvalidInitialization();

    /**
     * @dev Disable initializers to prevent reinitialization attacks
     * This ensures the contract can only be initialized once through the proxy
     */
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract (replaces constructor in upgradeable contracts)
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply to mint to the deployer
     * @param owner Address that will own the contract
     * 
     * Requirements:
     * - Can only be called once (enforced by initializer modifier)
     * - Owner must be a valid address
     */
    function initialize(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) public initializer {
        if (owner == address(0)) {
            revert InvalidInitialization();
        }

        __ERC20_init(name, symbol);
        __Ownable_init(); // Sets owner to msg.sender
        __UUPSUpgradeable_init();

        // Transfer ownership to specified owner if different from msg.sender
        if (owner != msg.sender) {
            _transferOwnership(owner);
        }

        if (initialSupply > 0) {
            _mint(owner, initialSupply);
        }
    }

    /**
     * @dev Authorize upgrade - only owner can upgrade the contract
     * This is a security control required by UUPS pattern
     * @param newImplementation Address of the new implementation contract
     * 
     * Requirements:
     * - Only callable by owner
     * - New implementation must be a valid contract
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {
        // Additional validation can be added here if needed
        // For example: check that newImplementation is a valid contract
        require(
            newImplementation != address(0),
            "UpgradeableERC20: invalid implementation address"
        );
    }

    /**
     * @dev Mint new tokens (can be overridden in v2 for additional features)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * 
     * Requirements:
     * - Only callable by owner
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}

