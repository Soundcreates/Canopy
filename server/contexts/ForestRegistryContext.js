const { ethers } = require('ethers');
const ForestRegistryData = require('../contractData/ForestRegistry.json');

class ForestRegistryContext {
  constructor(rpcUrl, privateKey) {
    if (!rpcUrl) {
      throw new Error('RPC URL is required');
    }

    // Create provider
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Create signer if private key is provided
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(
        ForestRegistryData.address,
        ForestRegistryData.abi,
        this.signer
      );
    } else {
      // Read-only contract
      this.contract = new ethers.Contract(
        ForestRegistryData.address,
        ForestRegistryData.abi,
        this.provider
      );
    }
  }

  // Register a new forest
  async registerForest(area, geoHash) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.registerForest(area, geoHash);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to register forest: ${error.message}`);
    }
  }

  // Deactivate a forest
  async deactivateForest(forestId) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.deactivateForest(forestId);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to deactivate forest: ${error.message}`);
    }
  }

  // Transfer forest to new owner
  async transferForest(forestId, newOwner) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.transferForest(forestId, newOwner);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to transfer forest: ${error.message}`);
    }
  }

  // Get forest count
  async getForestCount() {
    try {
      const count = await this.contract.forestCount();
      return Number(count);
    } catch (error) {
      throw new Error(`Failed to get forest count: ${error.message}`);
    }
  }

  // Get forest by ID
  async getForest(forestId) {
    try {
      const forest = await this.contract.getForest(forestId);
      return {
        forestId: Number(forest.forestId),
        owner: forest.owner,
        area: Number(forest.area),
        geoHash: forest.geoHash,
        isActive: forest.isActive,
      };
    } catch (error) {
      throw new Error(`Failed to get forest: ${error.message}`);
    }
  }

  // Check if forest is active
  async isActive(forestId) {
    try {
      const active = await this.contract.isActive(forestId);
      return active;
    } catch (error) {
      throw new Error(`Failed to check forest status: ${error.message}`);
    }
  }

  // Get owner's forests
  async getOwnerForests(ownerAddress) {
    try {
      const forests = await this.contract.ownerForests(ownerAddress);
      return forests.map((id) => Number(id));
    } catch (error) {
      throw new Error(`Failed to get owner forests: ${error.message}`);
    }
  }

  // Get forest details by ID (from mapping)
  async getForestDetails(forestId) {
    try {
      const forest = await this.contract.forests(forestId);
      return {
        forestId: Number(forest.forestId),
        owner: forest.owner,
        area: Number(forest.area),
        geoHash: forest.geoHash,
        isActive: forest.isActive,
      };
    } catch (error) {
      throw new Error(`Failed to get forest details: ${error.message}`);
    }
  }

  // Get contract address
  getContractAddress() {
    return ForestRegistryData.address;
  }

  // Get contract instance (for advanced usage)
  getContract() {
    return this.contract;
  }

  // Get provider
  getProvider() {
    return this.provider;
  }

  // Get signer (if available)
  getSigner() {
    return this.signer;
  }
}

module.exports = ForestRegistryContext;

