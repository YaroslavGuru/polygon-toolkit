// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./UpgradeableERC20V1.sol";

/**
 * @title UpgradeableERC20V2
 * @dev Upgraded version of UpgradeableERC20V1
 * 
 * New Features:
 * - Version function returns "2.0.0"
 * - Additional utility functions
 * 
 * Important:
 * - Storage layout must match V1 exactly
 * - Only new functions or modified logic, no new state variables
 */
contract UpgradeableERC20V2 is UpgradeableERC20V1 {
    /**
     * @dev Override version to return V2 version
     */
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }

    /**
     * @dev New function in V2: Get contract metadata
     * @return name Token name
     * @return symbol Token symbol
     * @return totalSupply Total supply
     * @return contractVersion Contract version
     */
    function getMetadata()
        public
        view
        returns (
            string memory name,
            string memory symbol,
            uint256 totalSupply,
            string memory contractVersion
        )
    {
        return (name(), symbol(), totalSupply(), version());
    }

    /**
     * @dev New function in V2: Batch transfer
     * Allows owner to transfer tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to transfer (must match recipients length)
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(
            recipients.length == amounts.length,
            "UpgradeableERC20V2: arrays length mismatch"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(owner(), recipients[i], amounts[i]);
        }
    }
}

