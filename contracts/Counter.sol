// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

contract Counter {
    uint256 private number;

    function increment() external {
        number++;
    }

    function decrement() external {
        number--;
    }

    function getNumber() external view returns (uint256) {
        return number;
    }
}
