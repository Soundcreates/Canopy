//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract ForestRegistry {
    //by default uint is uint256
    struct Forest{ 
        uint forestId;
        address owner;
        uint area;
        string geoHash;
        bool isActive;
    }

    uint public forestCount;
    mapping(uint => Forest) public forests;
    mapping(address => uint[]) public ownerForests;

    //events
    event ForestRegistered(uint forestId, address owner, uint area, string geoHash);
    event ForestDeactivated(uint forestId, address owner);
    event ForestTransferred(uint forestId, address oldOwner, address newOwner);


   constructor() {
    forestCount = 0;
   }

    function registerForest(uint area, string calldata geoHash) external {
        forestCount++;

        //some requirment checks'
        require(ownerForests[msg.sender].length < 10 , "Max forests per owner reached");
        require(msg.sender != address(0), "Invalid sender");
        require(area > 0, "Area must be greater than 0");
        require(bytes(geoHash).length > 0, "GeoHash must be provided");
        require(forests[forestCount].owner == address(0), "Forest is already registered");
        //simple logik to create a new forest
        Forest newForest = new Forest(
            forestCount,
            msg.sender,
            area,
            geoHash,
            true
        )

        forests[forestCount] = newForest;
        ownerForests[msg.sender].push(forestCount);
        emit ForestRegistered(forestCount, msg.sender, area, geoHash);

    }
    //i could have made a modifier for this but nahh ts fine
    function deactivateForest(uint 256 forestId) external {
        require(forests[forestId].isActive == true, "Forest is not active");
        require(forests[forestId].owner == msg.sender, "You are not the owner of this forest");
        forests[forestId].isActive = false;
        emit ForestDeactivated(forestId, msg.sender);
    }

    function transferForest(uint256 forestId, address newOwner) external {
        //some requirment checks
        require(forestId > 0 && forestId <= forestCount, "Invalid forest ID");
        require(forests[forestId].owner == msg.sender, "You are not the owner of this forest");
        require(newOwner != address(0), "Invalid new owner");
        require(newOwner != forests[forestId].owner, "New owner is the same as the current owner");
        require(ownerForests[newOwner].length < 10, "Max forests per owner reached");

        //removing from old owners list
        uint[] storage oldOwnerForests = ownerForests[msg.sender];
        
        for(uint i =0;i<oldOwnerForests.length; i++){
            if(oldOwnerForests[i] == forestId){
                oldOwnerForests[i] = oldOwnerForests[oldOwnerForests.length - 1];
                oldOwnerForests.pop();
                break;
            }
        }

        //transferring the forest
        forests[forestId].owner = newOwner;
        forests[forestId].isActive = true;
        ownerForests[newOwner].push(forestId);
        emit ForestTransferred(forestId, msg.sender, newOwner);
    }

    //some helper functions
    function isActive(uint forestId) external view returns (bool) {
        return forests[forestId].isActive;
    }

    function getForest(uint forestId) external view returns (Forest memory){
        return forests[forestId];
    }


}