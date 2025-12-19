const { ethers } = require('ethers');

/**
 * Governance contract ABI - minimal interface for reading parameters
 * Only includes the getParameters() function we need
 */
const GOVERNANCE_ABI = [
  {
    "inputs": [],
    "name": "getParameters",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "minNdviDelta",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minConfidence",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "verificationIntervalDays",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

class GovernanceContext {
  constructor(rpcUrl, governanceAddress) {
    console.log("Initializing GovernanceContext");
    console.log("RPC URL:", rpcUrl);
    console.log("Governance Address:", governanceAddress);
    
    if (!rpcUrl) {
      console.log("RPC URL validation failed - RPC URL is required");
      throw new Error('RPC URL is required');
    }

    if (!governanceAddress) {
      console.log("Governance address validation failed - Governance address is required");
      throw new Error('Governance contract address is required');
    }

    // Create provider
    console.log("Creating JSON RPC provider");
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log("Provider created successfully");

    // Create read-only contract instance
    console.log("Creating read-only Governance contract instance");
    this.contract = new ethers.Contract(
      governanceAddress,
      GOVERNANCE_ABI,
      this.provider
    );
    console.log("Governance contract instance created");
    console.log("Contract address:", governanceAddress);
    console.log("GovernanceContext initialized successfully");
  }

  /**
   * Fetch current protocol parameters from the Governance contract
   * @returns {Promise<{minNdviDelta: number, minConfidence: number, verificationIntervalDays: number}>}
   *   Parameters with scaled values converted to decimals (divided by 1e4)
   */
  async getParameters() {
    console.log("Fetching protocol parameters from Governance contract");
    
    try {
      console.log("Calling getParameters() on Governance contract");
      const result = await this.contract.getParameters();
      console.log("Raw parameters received from contract:", {
        minNdviDelta: result.minNdviDelta.toString(),
        minConfidence: result.minConfidence.toString(),
        verificationIntervalDays: result.verificationIntervalDays.toString()
      });

      // Convert from scaled values (1e4) to decimals
      const SCALE_FACTOR = 10000; // 1e4
      const minNdviDelta = Number(result.minNdviDelta) / SCALE_FACTOR;
      const minConfidence = Number(result.minConfidence) / SCALE_FACTOR;
      const verificationIntervalDays = Number(result.verificationIntervalDays);

      console.log("Converted parameters (scaled by 1e4):", {
        minNdviDelta,
        minConfidence,
        verificationIntervalDays
      });

      return {
        minNdviDelta,
        minConfidence,
        verificationIntervalDays
      };
    } catch (error) {
      console.error("Error fetching parameters from Governance contract:", error);
      console.error("Error message:", error.message);
      throw new Error(`Failed to fetch Governance parameters: ${error.message}`);
    }
  }

  // Get provider
  getProvider() {
    console.log("Getting provider");
    return this.provider;
  }

  // Get contract instance (for advanced usage)
  getContract() {
    console.log("Getting contract instance");
    return this.contract;
  }

  // Get contract address
  getContractAddress() {
    console.log("Getting contract address");
    return this.contract.target;
  }
}

module.exports = GovernanceContext;





