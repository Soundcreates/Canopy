const { ethers } = require('ethers');
const CarbonCreditNFTData = require('../contractData/CarbonCreditNFT.json');

class CarbonCreditNFTContext {
  constructor(rpcUrl, privateKey) {
    console.log("Initializing CarbonCreditNFTContext");
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
        CarbonCreditNFTData.address,
        CarbonCreditNFTData.abi,
        this.signer
      );
      console.log("Contract instance created with signer");
      console.log("Contract address:", CarbonCreditNFTData.address);
    } else {
      // Read-only contract
      console.log("No private key provided, creating read-only contract instance");
      this.contract = new ethers.Contract(
        CarbonCreditNFTData.address,
        CarbonCreditNFTData.abi,
        this.provider
      );
      console.log("Read-only contract instance created");
      console.log("Contract address:", CarbonCreditNFTData.address);
    }

    // Health Status enum values
    console.log("Initializing Health Status enum values");
    this.HealthStatus = {
      UNKNOWN: 0,
      HEALTHY: 1,
      DEGRADED: 2,
      INVALID: 3,
    };
    console.log("Health Status enum initialized");
    console.log("CarbonCreditNFTContext initialized successfully");
  }

  // Mint a new carbon credit NFT (only owner)
  async mintCredit(to, forestId, initialTokenURI) {
    console.log("Minting new carbon credit NFT");
    console.log("Recipient address:", to);
    console.log("Forest ID:", forestId);
    console.log("Initial token URI:", initialTokenURI);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      console.log("Signer address:", this.signer.address);
      
      // Verify that the signer is the contract owner (mintCredit has onlyOwner modifier)
      console.log("Verifying signer is contract owner");
      const contractOwner = await this.contract.owner();
      console.log("Contract owner address:", contractOwner);
      console.log("Signer address:", this.signer.address);
      
      if (this.signer.address.toLowerCase() !== contractOwner.toLowerCase()) {
        console.log("ERROR: Signer address does not match contract owner");
        console.log("Signer:", this.signer.address);
        console.log("Owner:", contractOwner);
        throw new Error(`Signer address (${this.signer.address}) is not the contract owner (${contractOwner}). mintCredit requires onlyOwner modifier.`);
      }
      console.log("Signer is verified as contract owner");
      
      // Validate forestId is not zero
      if (!forestId || forestId === 0) {
        console.log("ERROR: Invalid forest ID - forestId cannot be zero");
        throw new Error('Invalid forest ID: forestId cannot be zero');
      }
      console.log("Forest ID validation passed");
      
      console.log("Calling mintCredit contract method");
      const tx = await this.contract.mintCredit(to, forestId, initialTokenURI);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      
      console.log("Getting next token ID");
      const tokenId = await this.contract.nextTokenId();
      const tokenIdNumber = Number(tokenId);
      console.log("Token ID:", tokenIdNumber);
      console.log("Carbon credit NFT minted successfully");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt, tokenId: tokenIdNumber };
    } catch (error) {
      console.error("Error minting credit:", error);
      console.error("Error message:", error.message);
      
      // Check if it's an access control error
      if (error.message && error.message.includes('execution reverted')) {
        console.error("This appears to be an access control error.");
        console.error("mintCredit requires the contract owner to call it (onlyOwner modifier).");
        console.error("Please ensure you are using the OWNER_PRIVATE_KEY, not ORACLE_PRIVATE_KEY.");
      }
      
      throw new Error(`Failed to mint credit: ${error.message}`);
    }
  }

  // Update health status (only oracle)
  async updateHealthStatus(forestId, newStatus) {
    console.log("Updating forest health status");
    console.log("Forest ID:", forestId);
    console.log("New status:", newStatus);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling updateHealthStatus contract method");
      const tx = await this.contract.updateHealthStatus(forestId, newStatus);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Health status updated successfully");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt };
    } catch (error) {
      console.error("Error updating health status:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to update health status: ${error.message}`);
    }
  }

  // Update metadata (only owner)
  async updateMetadata(tokenId, newUri) {
    console.log("Updating token metadata");
    console.log("Token ID:", tokenId);
    console.log("New URI:", newUri);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling updateMetadata contract method");
      const tx = await this.contract.updateMetadata(tokenId, newUri);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Metadata updated successfully");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt };
    } catch (error) {
      console.error("Error updating metadata:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to update metadata: ${error.message}`);
    }
  }

  // Set oracle address (only owner)
  async setOracle(newOracle) {
    console.log("Setting oracle address");
    console.log("New oracle address:", newOracle);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling setOracle contract method");
      const tx = await this.contract.setOracle(newOracle);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Oracle address set successfully");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt };
    } catch (error) {
      console.error("Error setting oracle:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to set oracle: ${error.message}`);
    }
  }

  // ERC721 Standard Functions

  // Get balance of an address
  async balanceOf(owner) {
    console.log("Getting balance of address");
    console.log("Owner address:", owner);
    
    try {
      console.log("Calling balanceOf contract method");
      const balance = await this.contract.balanceOf(owner);
      const balanceNumber = Number(balance);
      console.log("Balance retrieved:", balanceNumber);
      return balanceNumber;
    } catch (error) {
      console.error("Error getting balance:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // Get owner of a token
  async ownerOf(tokenId) {
    console.log("Getting owner of token");
    console.log("Token ID:", tokenId);
    
    try {
      console.log("Calling ownerOf contract method");
      const owner = await this.contract.ownerOf(tokenId);
      console.log("Token owner retrieved:", owner);
      return owner;
    } catch (error) {
      console.error("Error getting owner:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get owner: ${error.message}`);
    }
  }

  // Get token URI
  async tokenURI(tokenId) {
    console.log("Getting token URI");
    console.log("Token ID:", tokenId);
    
    try {
      console.log("Calling tokenURI contract method");
      const uri = await this.contract.tokenURI(tokenId);
      console.log("Token URI retrieved:", uri);
      return uri;
    } catch (error) {
      console.error("Error getting token URI:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get token URI: ${error.message}`);
    }
  }

  // Get next token ID
  async getNextTokenId() {
    console.log("Getting next token ID");
    
    try {
      console.log("Calling nextTokenId contract method");
      const tokenId = await this.contract.nextTokenId();
      const tokenIdNumber = Number(tokenId);
      console.log("Next token ID retrieved:", tokenIdNumber);
      return tokenIdNumber;
    } catch (error) {
      console.error("Error getting next token ID:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get next token ID: ${error.message}`);
    }
  }

  // Get forest ID for a token
  async getTokenForest(tokenId) {
    console.log("Getting forest ID for token");
    console.log("Token ID:", tokenId);
    
    try {
      console.log("Calling tokenForest contract method");
      const forestId = await this.contract.tokenForest(tokenId);
      const forestIdNumber = Number(forestId);
      console.log("Forest ID retrieved:", forestIdNumber);
      return forestIdNumber;
    } catch (error) {
      console.error("Error getting token forest:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get token forest: ${error.message}`);
    }
  }

  // Get health status for a forest
  async getForestHealthStatus(forestId) {
    console.log("Getting health status for forest");
    console.log("Forest ID:", forestId);
    
    try {
      console.log("Calling forestHealthStatus contract method");
      const status = await this.contract.forestHealthStatus(forestId);
      const statusNumber = Number(status);
      console.log("Health status retrieved:", statusNumber);
      return statusNumber;
    } catch (error) {
      console.error("Error getting health status:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get health status: ${error.message}`);
    }
  }

  // Get oracle address
  async getOracle() {
    console.log("Getting oracle address");
    
    try {
      console.log("Calling oracle contract method");
      const oracle = await this.contract.oracle();
      console.log("Oracle address retrieved:", oracle);
      return oracle;
    } catch (error) {
      console.error("Error getting oracle address:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get oracle address: ${error.message}`);
    }
  }

  // Transfer functions
  async transferFrom(from, to, tokenId) {
    console.log("Transferring token");
    console.log("From address:", from);
    console.log("To address:", to);
    console.log("Token ID:", tokenId);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling transferFrom contract method");
      const tx = await this.contract.transferFrom(from, to, tokenId);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Token transfer successful");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt };
    } catch (error) {
      console.error("Error transferring token:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to transfer: ${error.message}`);
    }
  }

  async safeTransferFrom(from, to, tokenId, data = '0x') {
    console.log("Safely transferring token");
    console.log("From address:", from);
    console.log("To address:", to);
    console.log("Token ID:", tokenId);
    console.log("Data:", data);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling safeTransferFrom contract method");
      const tx = await this.contract.safeTransferFrom(from, to, tokenId, data);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Safe token transfer successful");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt };
    } catch (error) {
      console.error("Error safe transferring token:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to safe transfer: ${error.message}`);
    }
  }

  // Approval functions
  async approve(to, tokenId) {
    console.log("Approving token");
    console.log("Approved address:", to);
    console.log("Token ID:", tokenId);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling approve contract method");
      const tx = await this.contract.approve(to, tokenId);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Token approval successful");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt };
    } catch (error) {
      console.error("Error approving token:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to approve: ${error.message}`);
    }
  }

  async setApprovalForAll(operator, approved) {
    console.log("Setting approval for all tokens");
    console.log("Operator address:", operator);
    console.log("Approved:", approved);
    
    try {
      console.log("Checking if signer is available");
      if (!this.signer) {
        console.log("Signer not available - private key required for transactions");
        throw new Error('Private key required for transactions');
      }
      console.log("Signer is available");
      
      console.log("Calling setApprovalForAll contract method");
      const tx = await this.contract.setApprovalForAll(operator, approved);
      console.log("Transaction sent, hash:", tx.hash);
      console.log("Waiting for transaction receipt");
      const receipt = await tx.wait();
      console.log("Transaction receipt received");
      console.log("Block number:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      console.log("Approval for all set successfully");
      console.log("Transaction hash:", tx.hash);
      return { hash: tx.hash, receipt };
    } catch (error) {
      console.error("Error setting approval for all:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to set approval for all: ${error.message}`);
    }
  }

  async getApproved(tokenId) {
    console.log("Getting approved address for token");
    console.log("Token ID:", tokenId);
    
    try {
      console.log("Calling getApproved contract method");
      const approved = await this.contract.getApproved(tokenId);
      console.log("Approved address retrieved:", approved);
      return approved;
    } catch (error) {
      console.error("Error getting approved address:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get approved address: ${error.message}`);
    }
  }

  async isApprovedForAll(owner, operator) {
    console.log("Checking if operator is approved for all");
    console.log("Owner address:", owner);
    console.log("Operator address:", operator);
    
    try {
      console.log("Calling isApprovedForAll contract method");
      const isApproved = await this.contract.isApprovedForAll(owner, operator);
      console.log("Approval status retrieved:", isApproved);
      return isApproved;
    } catch (error) {
      console.error("Error checking approval:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to check approval: ${error.message}`);
    }
  }

  // Get contract name and symbol
  async getName() {
    console.log("Getting contract name");
    
    try {
      console.log("Calling name contract method");
      const name = await this.contract.name();
      console.log("Contract name retrieved:", name);
      return name;
    } catch (error) {
      console.error("Error getting name:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get name: ${error.message}`);
    }
  }

  async getSymbol() {
    console.log("Getting contract symbol");
    
    try {
      console.log("Calling symbol contract method");
      const symbol = await this.contract.symbol();
      console.log("Contract symbol retrieved:", symbol);
      return symbol;
    } catch (error) {
      console.error("Error getting symbol:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to get symbol: ${error.message}`);
    }
  }

  // Get contract address
  getContractAddress() {
    console.log("Getting contract address");
    const address = CarbonCreditNFTData.address;
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

  // Get HealthStatus enum
  getHealthStatus() {
    console.log("Getting HealthStatus enum");
    return this.HealthStatus;
  }
}

module.exports = CarbonCreditNFTContext;

