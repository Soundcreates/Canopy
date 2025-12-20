//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CTKToken is ERC20, Ownable {
    uint256 public constant SIGNUP_BONUS = 500 * 10**18; // 500 tokens with 18 decimals
    
    mapping(address => bool) public hasReceivedSignupBonus;
    
    address public oracle;
    
    event SignupBonusMinted(address indexed recipient, uint256 amount);

   constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _oracle
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        if (_initialSupply > 0) {
            _mint(msg.sender, _initialSupply);
        }
        oracle = _oracle;
    }
    
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "CTKToken: invalid oracle address");
        oracle = _oracle;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracle, "CTKToken: only oracle can call");
        _;
    }
    
    function mintSignupBonus(address _to) external onlyOracle {
        require(_to != address(0), "CTKToken: invalid address");
        require(!hasReceivedSignupBonus[_to], "CTKToken: signup bonus already claimed");
        
        hasReceivedSignupBonus[_to] = true;
        _mint(_to, SIGNUP_BONUS);
        
        emit SignupBonusMinted(_to, SIGNUP_BONUS);
    }

    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    function batchMint(address[] calldata _recipients, uint256[] calldata _amounts) external onlyOwner {
        require(_recipients.length == _amounts.length, "CTKToken: arrays length mismatch");
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            _mint(_recipients[i], _amounts[i]);
        }
    }
}

