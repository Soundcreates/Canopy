const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Service for interacting with the Governance DAO contract
 * Handles proposal creation and voting on-chain
 */
class GovernanceService {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.signer = null;
        this.initialized = false;
    }

    /**
     * Initialize the governance service
     */
    async initialize() {
        try {
            // Load contract data
            const contractDataPath = path.join(__dirname, '../contractData/Governance.json');
            const contractData = JSON.parse(fs.readFileSync(contractDataPath, 'utf8'));
            
            // Get contract address from env or contract data
            const contractAddress = process.env.GOVERNANCE_CONTRACT_ADDRESS || contractData.address;
            if (!contractAddress) {
                throw new Error('GOVERNANCE_CONTRACT_ADDRESS not set in environment or contractData/Governance.json');
            }

            // Initialize provider
            const rpcUrl = process.env.RPC_URL || process.env.ETH_RPC_URL;
            if (!rpcUrl) {
                throw new Error('RPC_URL or ETH_RPC_URL not set in environment');
            }

            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            this.contract = new ethers.Contract(contractAddress, contractData.abi, this.provider);

            // If oracle private key is set, create signer for automated operations
            const oraclePrivateKey = process.env.GOVERNANCE_ORACLE_PRIVATE_KEY;
            if (oraclePrivateKey) {
                this.signer = new ethers.Wallet(oraclePrivateKey, this.provider);
                this.contract = new ethers.Contract(contractAddress, contractData.abi, this.signer);
                console.log('Governance Service initialized with oracle signer');
            } else {
                console.log('Governance Service initialized in read-only mode (no oracle key)');
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing Governance Service:', error);
            this.initialized = false;
            throw error;
        }
    }

    /**
     * Create a proposal for forest registration
     * Uses current protocol parameters (no changes)
     * @param {string} proposerAddress - Address of the proposer
     * @param {number} votingPeriodBlocks - Voting period in blocks (default: 7 days = 302400 blocks)
     * @returns {Promise<{proposalId: number, txHash: string}>}
     */
    async createProposal(proposerAddress, votingPeriodBlocks = 302400) {
        if (!this.initialized || !this.contract) {
            throw new Error('Governance Service not initialized');
        }

        if (!this.signer) {
            throw new Error('No signer available. Set GOVERNANCE_ORACLE_PRIVATE_KEY for automated proposal creation');
        }

        try {
            // Get current protocol parameters
            const parameters = await this.contract.getParameters();
            
            // Create proposal with current parameters (0 means keep unchanged)
            // But we need to pass at least one non-zero value, so we'll use current values
            const tx = await this.contract.createProposal(
                parameters.minNdviDelta,
                parameters.minConfidence,
                parameters.verificationIntervalDays,
                votingPeriodBlocks,
                { gasLimit: 500000 }
            );

            const receipt = await tx.wait();
            
            // Extract proposal ID from events
            const proposalEvent = receipt.logs.find(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed && parsed.name === 'ProposalCreated';
                } catch {
                    return false;
                }
            });

            if (proposalEvent) {
                const parsed = this.contract.interface.parseLog(proposalEvent);
                const proposalId = Number(parsed.args.proposalId);
                
                console.log(`Proposal created: ID=${proposalId}, TX=${receipt.hash}`);
                return {
                    proposalId,
                    txHash: receipt.hash
                };
            }

            throw new Error('Proposal created but ProposalCreated event not found');
        } catch (error) {
            console.error('Error creating proposal:', error);
            throw error;
        }
    }

    /**
     * Vote on a proposal
     * Note: This requires the voter to have a signer (frontend will handle this)
     * This is a helper to get the contract instance for voting
     * @param {string} voterAddress - Address of the voter
     * @param {number} proposalId - Proposal ID
     * @param {boolean} support - true for FOR, false for AGAINST
     * @param {ethers.Signer} signer - Signer for the transaction (from frontend)
     * @returns {Promise<{txHash: string}>}
     */
    async vote(proposalId, support, signer) {
        if (!this.initialized || !this.contract) {
            throw new Error('Governance Service not initialized');
        }

        if (!signer) {
            throw new Error('Signer is required for voting');
        }

        try {
            // Create contract instance with the provided signer
            const contractWithSigner = new ethers.Contract(
                this.contract.target,
                this.contract.interface,
                signer
            );

            const tx = await contractWithSigner.vote(proposalId, support, { gasLimit: 200000 });
            const receipt = await tx.wait();

            console.log(`Vote cast: Proposal=${proposalId}, Support=${support}, TX=${receipt.hash}`);
            return {
                txHash: receipt.hash
            };
        } catch (error) {
            console.error('Error voting on proposal:', error);
            throw error;
        }
    }

    /**
     * Get proposal details
     * @param {number} proposalId - Proposal ID
     * @returns {Promise<Object>}
     */
    async getProposal(proposalId) {
        if (!this.initialized || !this.contract) {
            throw new Error('Governance Service not initialized');
        }

        try {
            const proposal = await this.contract.getProposal(proposalId);
            return {
                proposalId: Number(proposalId),
                proposer: proposal.proposer,
                minNdviDelta: Number(proposal.proposedParams.minNdviDelta),
                minConfidence: Number(proposal.proposedParams.minConfidence),
                verificationIntervalDays: Number(proposal.proposedParams.verificationIntervalDays),
                startBlock: Number(proposal.startBlock),
                endBlock: Number(proposal.endBlock),
                forVotes: Number(proposal.forVotes),
                againstVotes: Number(proposal.againstVotes),
                executed: proposal.executed
            };
        } catch (error) {
            console.error('Error getting proposal:', error);
            throw error;
        }
    }

    /**
     * Check if a voter has voted on a proposal
     * @param {number} proposalId - Proposal ID
     * @param {string} voterAddress - Voter address
     * @returns {Promise<boolean>}
     */
    async hasVoterVoted(proposalId, voterAddress) {
        if (!this.initialized || !this.contract) {
            throw new Error('Governance Service not initialized');
        }

        try {
            return await this.contract.hasVoterVoted(proposalId, voterAddress);
        } catch (error) {
            console.error('Error checking vote status:', error);
            return false;
        }
    }

    /**
     * Get contract address
     */
    getContractAddress() {
        if (!this.contract) {
            return null;
        }
        return this.contract.target;
    }
}

// Export singleton instance
const governanceService = new GovernanceService();

// Initialize on module load if environment is ready
if (process.env.RPC_URL || process.env.ETH_RPC_URL) {
    governanceService.initialize().catch(err => {
        console.error('Failed to initialize governance service:', err);
    });
}

module.exports = { governanceService, GovernanceService };

