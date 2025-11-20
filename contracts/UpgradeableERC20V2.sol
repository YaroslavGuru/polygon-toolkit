// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./UpgradeableERC20.sol";

/**
 * @title UpgradeableERC20V2
 * @dev Version 2 of the upgradeable ERC20 token
 * @notice Demonstrates safe upgrade pattern - adds new functionality without breaking existing features
 * 
 * Key Points:
 * - Storage layout is preserved (no new state variables added before existing ones)
 * - New functionality is added incrementally
 * - All existing functions remain unchanged
 */
contract UpgradeableERC20V2 is UpgradeableERC20 {
    /// @dev Version string to identify the contract version
    string public constant VERSION = "2.0.0";

    /// @dev New state variable added AFTER existing storage (safe upgrade pattern)
    /// @notice This demonstrates adding new storage in a safe way
    mapping(address => uint256) public lastTransferTimestamp;

    /// @dev Disable initializers in v2 as well
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Get the current version of the contract
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return VERSION;
    }

    /**
     * @dev Override transfer to track last transfer timestamp
     * This is a new feature added in v2
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Whether the transfer was successful
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        returns (bool) 
    {
        // Call parent transfer
        bool success = super.transfer(to, amount);
        
        // Track last transfer timestamp (new v2 feature)
        if (success) {
            lastTransferTimestamp[msg.sender] = block.timestamp;
            lastTransferTimestamp[to] = block.timestamp;
        }
        
        return success;
    }

    /**
     * @dev Override transferFrom to track last transfer timestamp
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Whether the transfer was successful
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        returns (bool) 
    {
        // Call parent transferFrom
        bool success = super.transferFrom(from, to, amount);
        
        // Track last transfer timestamp (new v2 feature)
        if (success) {
            lastTransferTimestamp[from] = block.timestamp;
            lastTransferTimestamp[to] = block.timestamp;
        }
        
        return success;
    }

    /**
     * @dev Get the last transfer timestamp for an address
     * @param account Address to check
     * @return timestamp Last transfer timestamp (0 if never transferred)
     */
    function getLastTransferTimestamp(address account) 
        external 
        view 
        returns (uint256) 
    {
        return lastTransferTimestamp[account];
    }
}

