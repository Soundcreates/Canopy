const { ethers } = require('ethers');
const CarbonCreditNFTData = require('../contractData/CarbonCreditNFT.json');

class CarbonCreditNFTContext {
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
        CarbonCreditNFTData.address,
        CarbonCreditNFTData.abi,
        this.signer
      );
    } else {
      // Read-only contract
      this.contract = new ethers.Contract(
        CarbonCreditNFTData.address,
        CarbonCreditNFTData.abi,
        this.provider
      );
    }

    // Health Status enum values
    this.HealthStatus = {
      UNKNOWN: 0,
      HEALTHY: 1,
      DEGRADED: 2,
      INVALID: 3,
    };
  }

  // Mint a new carbon credit NFT (only owner)
  async mintCredit(to, forestId, initialTokenURI) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.mintCredit(to, forestId, initialTokenURI);
      const receipt = await tx.wait();
      const tokenId = await this.contract.nextTokenId();
      return { hash: tx.hash, receipt, tokenId: Number(tokenId) };
    } catch (error) {
      throw new Error(`Failed to mint credit: ${error.message}`);
    }
  }

  // Update health status (only oracle)
  async updateHealthStatus(forestId, newStatus) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.updateHealthStatus(forestId, newStatus);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to update health status: ${error.message}`);
    }
  }

  // Update metadata (only owner)
  async updateMetadata(tokenId, newUri) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.updateMetadata(tokenId, newUri);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to update metadata: ${error.message}`);
    }
  }

  // Set oracle address (only owner)
  async setOracle(newOracle) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.setOracle(newOracle);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to set oracle: ${error.message}`);
    }
  }

  // ERC721 Standard Functions

  // Get balance of an address
  async balanceOf(owner) {
    try {
      const balance = await this.contract.balanceOf(owner);
      return Number(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // Get owner of a token
  async ownerOf(tokenId) {
    try {
      return await this.contract.ownerOf(tokenId);
    } catch (error) {
      throw new Error(`Failed to get owner: ${error.message}`);
    }
  }

  // Get token URI
  async tokenURI(tokenId) {
    try {
      return await this.contract.tokenURI(tokenId);
    } catch (error) {
      throw new Error(`Failed to get token URI: ${error.message}`);
    }
  }

  // Get next token ID
  async getNextTokenId() {
    try {
      const tokenId = await this.contract.nextTokenId();
      return Number(tokenId);
    } catch (error) {
      throw new Error(`Failed to get next token ID: ${error.message}`);
    }
  }

  // Get forest ID for a token
  async getTokenForest(tokenId) {
    try {
      const forestId = await this.contract.tokenForest(tokenId);
      return Number(forestId);
    } catch (error) {
      throw new Error(`Failed to get token forest: ${error.message}`);
    }
  }

  // Get health status for a forest
  async getForestHealthStatus(forestId) {
    try {
      const status = await this.contract.forestHealthStatus(forestId);
      return Number(status);
    } catch (error) {
      throw new Error(`Failed to get health status: ${error.message}`);
    }
  }

  // Get oracle address
  async getOracle() {
    try {
      return await this.contract.oracle();
    } catch (error) {
      throw new Error(`Failed to get oracle address: ${error.message}`);
    }
  }

  // Transfer functions
  async transferFrom(from, to, tokenId) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.transferFrom(from, to, tokenId);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to transfer: ${error.message}`);
    }
  }

  async safeTransferFrom(from, to, tokenId, data = '0x') {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.safeTransferFrom(from, to, tokenId, data);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to safe transfer: ${error.message}`);
    }
  }

  // Approval functions
  async approve(to, tokenId) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.approve(to, tokenId);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to approve: ${error.message}`);
    }
  }

  async setApprovalForAll(operator, approved) {
    try {
      if (!this.signer) {
        throw new Error('Private key required for transactions');
      }
      const tx = await this.contract.setApprovalForAll(operator, approved);
      const receipt = await tx.wait();
      return { hash: tx.hash, receipt };
    } catch (error) {
      throw new Error(`Failed to set approval for all: ${error.message}`);
    }
  }

  async getApproved(tokenId) {
    try {
      return await this.contract.getApproved(tokenId);
    } catch (error) {
      throw new Error(`Failed to get approved address: ${error.message}`);
    }
  }

  async isApprovedForAll(owner, operator) {
    try {
      return await this.contract.isApprovedForAll(owner, operator);
    } catch (error) {
      throw new Error(`Failed to check approval: ${error.message}`);
    }
  }

  // Get contract name and symbol
  async getName() {
    try {
      return await this.contract.name();
    } catch (error) {
      throw new Error(`Failed to get name: ${error.message}`);
    }
  }

  async getSymbol() {
    try {
      return await this.contract.symbol();
    } catch (error) {
      throw new Error(`Failed to get symbol: ${error.message}`);
    }
  }

  // Get contract address
  getContractAddress() {
    return CarbonCreditNFTData.address;
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

  // Get HealthStatus enum
  getHealthStatus() {
    return this.HealthStatus;
  }
}

module.exports = CarbonCreditNFTContext;

