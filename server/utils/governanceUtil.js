const GovernanceContext = require('../contexts/GovernanceContext');

/**
 * Fetch protocol parameters from the Governance contract
 * This function fetches fresh parameters every time it's called (no caching)
 * 
 * @param {string} rpcUrl - RPC URL for blockchain connection
 * @param {string} governanceAddress - Address of the Governance contract
 * @returns {Promise<{minNdviDelta: number, minConfidence: number, verificationIntervalDays: number}>}
 * @throws {Error} If contract call fails or parameters cannot be fetched
 */
async function fetchProtocolParameters(rpcUrl, governanceAddress) {
  console.log("=== Fetching Protocol Parameters from Governance Contract ===");
  console.log("RPC URL:", rpcUrl ? "Set" : "Not set");
  console.log("Governance Address:", governanceAddress);

  if (!rpcUrl) {
    throw new Error('RPC_URL environment variable is required to fetch Governance parameters');
  }

  if (!governanceAddress) {
    throw new Error('GOVERNANCE_CONTRACT_ADDRESS environment variable is required');
  }

  try {
    const governanceContext = new GovernanceContext(rpcUrl, governanceAddress);
    const parameters = await governanceContext.getParameters();
    
    console.log("=== Protocol Parameters Fetched Successfully ===");
    console.log("DAO-defined minNdviDelta:", parameters.minNdviDelta);
    console.log("DAO-defined minConfidence:", parameters.minConfidence);
    console.log("DAO-defined verificationIntervalDays:", parameters.verificationIntervalDays);
    
    return parameters;
  } catch (error) {
    console.error("=== Failed to Fetch Protocol Parameters ===");
    console.error("Error:", error.message);
    throw error;
  }
}

module.exports = { fetchProtocolParameters };




