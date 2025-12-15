const { ethers } = require('ethers');
const ForestRegistryData = require('../contractData/ForestRegistry.json');

class ForestRegistryContext {
  constructor(rpcUrl, privateKey) {
    console.log("Initializing ForestRegistryContext");
    console.log("RPC URL:", rpcUrl);
    
    if (!rpcUrl) {
      console.log("RPC URL validation failed - RPC URL is required");
      throw new Error('RPC URL is required');
    }

    // Create provider
    console.log("Creating JSON RPC provider");
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log("Provider created successfully");

    // Create signer if private key is provided
    if (privateKey) {
      console.log("Private key provided, creating signer");
      this.signer = new ethers.Wallet(privateKey, this.provider);
      console.log("Signer address:", this.signer.address);
      console.log("Creating contract instance with signer");
      this.contract = new ethers.Contract(
        ForestRegistryData.address,
        ForestRegistryData.abi,
        this.signer
      );
      console.log("Contract instance created with signer");
      console.log("Contract address:", ForestRegistryData.address);
    } else {
      // Read-only contract
      console.log("No private key provided, creating read-only contract instance");
      this.contract = new ethers.Contract(
        ForestRegistryData.address,
        ForestRegistryData.abi,
        this.provider
      );
      console.log("Read-only contract instance created");
      console.log("Contract address:", ForestRegistryData.address);
    }
    console.log("ForestRegistryContext initialized successfully");
  }

  // Register a new forest
  async registerForest(area, geoHash) {
    console.log("Registering new forest");
    console.log("Area:", area);
    console.log("GeoHash:", geoHash);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling registerForest contract method");
      const tx = await this.contract.registerForest(area, geoHash);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());

      //parsing the forestId from the receipt
      //the event sign is ForestRegistered(uint forestId, addr owner, uint area, string geohash)
      console.log("Parsing ForestRegistered event from receipt logs");
      const eventSig = "ForestRegistered(uint forestId, address owner, uint area, string geoHash)";
      console.log("Looking for event signature:", eventSig);
     //this is the event object
      const eventLog= receipt.logs.find(log =>{
        try{
          const parsedLog = this.contract.interface.parseLog(log);
          return parsedLog && parsedLog.name === "ForestRegistered"; //returning two things ,one -> parsedLog, second -> boo
        }catch(error){  //err handling if the parsing fails, so the program doesnt crash out
            console.log("Error parsing log: ", error.message);   
            return false;
        }
      });
      //the above code is checking if the eventlogs have any logs that match the event
      if(eventLog){//now we will parse the event 
        console.log("ForestRegistered event found in receipt");
        const parsedEvent = this.contract.interface.parseLog(eventLog);
        console.log("Event parsed successfully");
        const forestId = Number(parsedEvent.args.forestId);
        console.log("Forest ID extracted from event:", forestId);
        console.log("Forest owner from event:", parsedEvent.args.owner);
        console.log("Forest area from event:", parsedEvent.args.area.toString());

        //simply returning the hash, receipt and the forestId ,as everything has went good
        console.log("Forest registration successful");
        console.log("Transaction hash:", tx.hash);
        console.log("Forest ID:", forestId);
        return { hash: tx.hash, receipt, forestId };
      }else{
        console.log("ForestRegistered event not found in receipt logs");
        throw new Error("Forest registered event not found in receipt");
      }
    } catch (error) {
      console.error("Error registering forest:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to register forest: ${error.message}`);
    }
  }

  // Deactivate a forest
  async deactivateForest(forestId) {
    console.log("Deactivating forest");
    console.log("Forest ID:", forestId);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling deactivateForest contract method");
      const tx = await this.contract.deactivateForest(forestId);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Forest deactivation successful");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt };
    } catch (error) {
      console.error("Error deactivating forest:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to deactivate forest: ${error.message}`);
    }
  }

  // Transfer forest to new owner
  async transferForest(forestId, newOwner) {
    console.log("Transferring forest to new owner");
    console.log("Forest ID:", forestId);
    console.log("New owner address:", newOwner);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling transferForest contract method");
      const tx = await this.contract.transferForest(forestId, newOwner);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Forest transfer successful");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt };
    } catch (error) {
      console.error("Error transferring forest:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to transfer forest: ${error.message}`);
    }
  }

  // Get forest count
  async getForestCount() {
    console.log("Getting forest count");
    
    try {
      console.log("Calling forestCount contract method");
      const count = await this.contract.forestCount();
      const countNumber = Number(count);
      console.log("Forest count retrieved:", countNumber);
      return countNumber;
    } catch (error) {
      console.error("Error getting forest count:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get forest count: ${error.message}`);
    }
  }

  // Get forest by ID
  async getForest(forestId) {
    console.log("Getting forest by ID");
    console.log("Forest ID:", forestId);
    
    try {
      console.log("Calling getForest contract method");
      const forest = await this.contract.getForest(forestId);
      console.log("Forest data retrieved from contract");
      const forestData = {
        forestId: Number(forest.forestId),
        owner: forest.owner,
        area: Number(forest.area),
        geoHash: forest.geoHash,
        isActive: forest.isActive,
      };
      console.log("Forest ID:", forestData.forestId);
      console.log("Forest owner:", forestData.owner);
      console.log("Forest area:", forestData.area);
      console.log("Forest geoHash:", forestData.geoHash);
      console.log("Forest isActive:", forestData.isActive);
      return forestData;
    } catch (error) {
      console.error("Error getting forest:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get forest: ${error.message}`);
    }
  }

  // Check if forest is active
  async isActive(forestId) {
    console.log("Checking if forest is active");
    console.log("Forest ID:", forestId);
    
    try {
      console.log("Calling isActive contract method");
      const active = await this.contract.isActive(forestId);
      console.log("Forest active status:", active);
      return active;
    } catch (error) {
      console.error("Error checking forest status:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to check forest status: ${error.message}`);
    }
  }

  // Get owner's forests
  async getOwnerForests(ownerAddress) {
    console.log("Getting owner's forests");
    console.log("Owner address:", ownerAddress);
    
    try {
      console.log("Calling ownerForests contract method");
      const forests = await this.contract.ownerForests(ownerAddress);
      const forestIds = forests.map((id) => Number(id));
      console.log("Owner forests retrieved");
      console.log("Number of forests:", forestIds.length);
      console.log("Forest IDs:", forestIds);
      return forestIds;
    } catch (error) {
      console.error("Error getting owner forests:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get owner forests: ${error.message}`);
    }
  }

  // Get forest details by ID (from mapping)
  async getForestDetails(forestId) {
    console.log("Getting forest details by ID from mapping");
    console.log("Forest ID:", forestId);
    
    try {
      console.log("Calling forests mapping contract method");
      const forest = await this.contract.forests(forestId);
      console.log("Forest data retrieved from mapping");
      const forestData = {
        forestId: Number(forest.forestId),
        owner: forest.owner,
        area: Number(forest.area),
        geoHash: forest.geoHash,
        isActive: forest.isActive,
      };
      console.log("Forest ID:", forestData.forestId);
      console.log("Forest owner:", forestData.owner);
      console.log("Forest area:", forestData.area);
      console.log("Forest geoHash:", forestData.geoHash);
      console.log("Forest isActive:", forestData.isActive);
      return forestData;
    } catch (error) {
      console.error("Error getting forest details:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get forest details: ${error.message}`);
    }
  }

  // Get contract address
  getContractAddress() {
    console.log("Getting contract address");
    const address = ForestRegistryData.address;
    console.log("Contract address:", address);
    return address;
  }

  // Get contract instance (for advanced usage)
  getContract() {
    console.log("Getting contract instance");
    return this.contract;
  }

  // Get provider
  getProvider() {
    console.log("Getting provider");
    return this.provider;
  }

  // Get signer (if available)
  getSigner() {
    console.log("Getting signer");
    if (this.signer) {
      console.log("Signer available, address:", this.signer.address);
    } else {
      console.log("Signer not available (read-only mode)");
    }
    return this.signer;
  }
}

module.exports = ForestRegistryContext;

