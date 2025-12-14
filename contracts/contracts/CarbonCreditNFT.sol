//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // the stanmdard contract template for nfts
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarbonCreditNFT is ERC721 {
    
    //desigfning the state
    enum HealthStatus{
        UNKNOWN,
        HEALTHY,
        DEGRADED,
        INVALID
    }


    mapping(uint => uint) public tokenForest; // ts mappin maps from tokenIds to forestId
    mapping(uint  => string) private _tokenURIs; // ts map is for mapping token ids to their uri (image uris)
    mapping(uint => HealthStatus) public forestHealthStatus;

    uint public nextTokenId;
    //oracle address 
    address public oracle;

    //events
    event CreditMinted(uint indexed tokenId, uint indexed forestId, address indexed owner);
    event MetaDataUpdate(uint indexed tokenId, string newUri); //the only metadata we will be changing is the image uri
    event HealthStatusUpdated(uint indexed tokenId, HealthStatus newStatus);

    constructor( address _oracle) ERC721("CarbonCreditNFT", "CCNFT") {
        oracle = _oracle;
    }

    function setOracle(address newOracle) external onlyOwner{
        require(newOracle != address(0), "Invalid oracle address");
        oracle = newOracle;
    } //only for the owner to call


    //minting the nft
    function mintCredit(address to, uint forestId, string callData initialTokenURI) external onlyOwner returns (uint256){
        require(forestId != 0 ,"Invalid forest ID");

        nextTokenId++;       
        uint256 tokenId =nextTokenId;

        _safeMint(to, tokenId);

        tokenForest[tokenId] = forestId;
        _tokenURIs[tokenId] = initialTokenURI;

        emit CreditMinted(tokenId, forestId, to);
        return tokenId;
        

    }

    //modfier to control access to only the oracle
    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call this function");
        _;
    }
    //these below funcs will be called by the backend (oracle)
    function updateHealthStatus(uint forestId, HealthStatus newStatus) external onlyOracle{
        require(forestId != 0 ,"Invalid forest ID");
        forestHealthStatus[forestId] = newStatus;
        emit HealthStatusUpdated(forestId, newStatus);
    }

    function updateMetadata(uint tokenId, string memory newUri) external onlOwner {
        require(tokenId > 0 && tokenId <= nextTokenId, "Invalid token ID");
        _tokenURIs[tokenId] = newUri;
        emit MetaDataUpdate(tokenId, newUri);
    }

    //helper functions
    function tokenURI (uint tokenId) public view override returns (string memory){
        require(tokenId > 0 && tokenId <= nextTokenId, "Invalid token ID");
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function _beforeTokentransfer(address from, address to, uint tokenId, batchSize) internal override{
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        if(from == addres(0) || to == address(0)) return;

        uint forestId = tokenForest[tokenId];

        requre(forestHealthStatus[forestId] != HealthStatus.HEALTHY, "Forest is not healthy");

    }

}