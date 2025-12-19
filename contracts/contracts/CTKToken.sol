//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CTKToken
 * @notice Governance token for the Carbon Verification Protocol DAO
 * @dev Simple ERC20 token with minting capability for token distribution
 */
contract CTKToken is ERC20, Ownable {
    /**
     * @notice Initialize the token with name, symbol, and optional initial supply
     * @param _name Token name (e.g., "Canopy Token")
     * @param _symbol Token symbol (e.g., "CTK")
     * @param _initialSupply Initial supply to mint to deployer (can be 0)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        if (_initialSupply > 0) {
            _mint(msg.sender, _initialSupply);
        }
    }

    /**
     * @notice Mint new tokens (only owner)
     * @dev Can be used to distribute tokens to governance participants
     * @param _to Address to receive the minted tokens
     * @param _amount Amount of tokens to mint
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    /**
     * @notice Batch mint tokens to multiple addresses
     * @dev Useful for initial token distribution
     * @param _recipients Array of addresses to receive tokens
     * @param _amounts Array of amounts to mint (must match recipients length)
     */
    function batchMint(address[] calldata _recipients, uint256[] calldata _amounts) external onlyOwner {
        require(_recipients.length == _amounts.length, "CTKToken: arrays length mismatch");
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            _mint(_recipients[i], _amounts[i]);
        }
    }
}

