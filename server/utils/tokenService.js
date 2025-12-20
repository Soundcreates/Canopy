const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Token Service for CTKToken operations
 * Handles signup bonus minting and token transfers
 */
class TokenService {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.signer = null;
        this.initialized = false;
    }

    /**
     * Initialize the token service
     */
    async initialize() {
        try {
            // Load contract data
            const contractDataPath = path.join(__dirname, '../contractData/CTKToken.json');
            const contractData = JSON.parse(fs.readFileSync(contractDataPath, 'utf8'));

            // Get RPC URL and private key from environment
            const rpcUrl = process.env.RPC_URL || process.env.ETH_RPC_URL;
            const privateKey = process.env.TOKEN_ORACLE_PRIVATE_KEY; // Private key for oracle

            if (!rpcUrl) {
                console.warn('RPC_URL not set, token service will not be available');
                return;
            }

            this.provider = new ethers.JsonRpcProvider(rpcUrl);

            if (privateKey) {
                this.signer = new ethers.Wallet(privateKey, this.provider);
                this.contract = new ethers.Contract(
                    contractData.address,
                    contractData.abi,
                    this.signer
                );
                console.log('Token Service initialized with oracle signer');
            } else {
                // Read-only mode
                this.contract = new ethers.Contract(
                    contractData.address,
                    contractData.abi,
                    this.provider
                );
                console.log('Token Service initialized in read-only mode (no oracle key)');
            }

            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Token Service:', error);
            this.initialized = false;
        }
    }

    /**
     * Mint signup bonus for a new user
     * @param {string} userAddress - Address of the user
     * @returns {Promise<boolean>} - Success status
     */
    async mintSignupBonus(userAddress) {
        if (!this.initialized || !this.contract) {
            console.warn('Token Service not initialized, skipping signup bonus');
            return false;
        }

        if (!this.signer) {
            console.warn('No oracle signer available, cannot mint signup bonus');
            return false;
        }

        try {
            // Check if user has already received signup bonus
            // Note: This requires the contract to have the hasReceivedSignupBonus mapping
            // If the contract doesn't have this function yet, we'll need to track it in DB
            const hasReceived = await this.contract.hasReceivedSignupBonus(userAddress);
            
            if (hasReceived) {
                console.log(`User ${userAddress} has already received signup bonus`);
                return false;
            }

            // Mint signup bonus
            const tx = await this.contract.mintSignupBonus(userAddress);
            await tx.wait();

            console.log(`Signup bonus minted for ${userAddress}`);
            return true;
        } catch (error) {
            console.error(`Error minting signup bonus for ${userAddress}:`, error);
            // Don't throw - allow user creation to continue even if token minting fails
            return false;
        }
    }

    /**
     * Check if a user has received signup bonus
     * @param {string} userAddress - Address of the user
     * @returns {Promise<boolean>}
     */
    async hasReceivedSignupBonus(userAddress) {
        if (!this.initialized || !this.contract) {
            return false;
        }

        try {
            return await this.contract.hasReceivedSignupBonus(userAddress);
        } catch (error) {
            console.error('Error checking signup bonus status:', error);
            return false;
        }
    }

    /**
     * Get token balance for a user
     * @param {string} userAddress - Address of the user
     * @returns {Promise<string>} - Balance as formatted string
     */
    async getBalance(userAddress) {
        if (!this.initialized || !this.contract) {
            return '0';
        }

        try {
            const balance = await this.contract.balanceOf(userAddress);
            const decimals = await this.contract.decimals();
            return ethers.formatUnits(balance, decimals);
        } catch (error) {
            console.error('Error getting token balance:', error);
            return '0';
        }
    }
}

// Export singleton instance
const tokenService = new TokenService();

// Initialize on module load if environment is ready
if (process.env.RPC_URL || process.env.ETH_RPC_URL) {
    tokenService.initialize().catch(err => {
        console.error('Failed to initialize token service:', err);
    });
}

module.exports = { tokenService, TokenService };

