//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import ForestRegistry from "./ForestRegistry.sol";


contract CarbonCreditNFT {
    ForestRegistry public forestRegistry;

    constructor(address _forestRegistry) {
        forestRegistry = ForestRegistry(_forestRegistry);
    }

}