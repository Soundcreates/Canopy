import { ethers } from 'ethers';
import GovernanceABI from '../../contracts/Governance.json'; // You'll need to add this

/**
 * Service for interacting with the Governance DAO contract for on-chain voting
 */
export class DAOVotingService {
    constructor(contractAddress, provider) {
        this.contractAddress = contractAddress;
        this.provider = provider;
        this.contract = null;
    }

    /**
     * Initialize the contract instance
     */
    async initialize(signer) {
        if (!this.contractAddress) {
            throw new Error('Governance contract address is required');
        }

        // If signer is provided, use it; otherwise use provider
        const contractProvider = signer || this.provider;
        
        this.contract = new ethers.Contract(
            this.contractAddress,
            GovernanceABI.abi,
            contractProvider
        );

        return this.contract;
    }

    /**
     * Create a proposal for forest registration
     * @param {Object} proposalData - Proposal data including forest details
     * @param {ethers.Signer} signer - Signer for the transaction
     */
    async createProposal(proposalData, signer) {
        if (!this.contract) {
            await this.initialize(signer);
        }

        try {
            // Get current protocol parameters
            const parameters = await this.contract.getParameters();
            
            // Create proposal with current parameters
            const tx = await this.contract.propose(
                parameters.minNdviDelta,
                parameters.minConfidence,
                parameters.verificationIntervalDays,
                {
                    gasLimit: 500000 // Adjust as needed
                }
            );

            const receipt = await tx.wait();
            
            // Extract proposal ID from events
            const proposalEvent = receipt.logs.find(
                log => {
                    try {
                        const parsed = this.contract.interface.parseLog(log);
                        return parsed.name === 'ProposalCreated';
                    } catch {
                        return false;
                    }
                }
            );

            if (proposalEvent) {
                const parsed = this.contract.interface.parseLog(proposalEvent);
                const proposalId = parsed.args.proposalId;
                return {
                    success: true,
                    proposalId: proposalId.toString(),
                    txHash: receipt.hash
                };
            }

            throw new Error('Proposal created but event not found');
        } catch (error) {
            console.error('Error creating proposal:', error);
            throw error;
        }
    }

    /**
     * Vote on a proposal
     * @param {string} proposalId - Proposal ID
     * @param {boolean} support - true for approve, false for reject
     * @param {ethers.Signer} signer - Signer for the transaction
     */
    async vote(proposalId, support, signer) {
        if (!this.contract) {
            await this.initialize(signer);
        }

        try {
            const tx = await this.contract.castVote(
                proposalId,
                support,
                {
                    gasLimit: 200000
                }
            );

            const receipt = await tx.wait();
            
            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error) {
            console.error('Error voting on proposal:', error);
            throw error;
        }
    }

    /**
     * Execute a proposal after voting period ends
     * @param {string} proposalId - Proposal ID
     * @param {ethers.Signer} signer - Signer for the transaction
     */
    async executeProposal(proposalId, signer) {
        if (!this.contract) {
            await this.initialize(signer);
        }

        try {
            const tx = await this.contract.execute(proposalId, {
                gasLimit: 500000
            });

            const receipt = await tx.wait();
            
            return {
                success: true,
                txHash: receipt.hash
            };
        } catch (error) {
            console.error('Error executing proposal:', error);
            throw error;
        }
    }

    /**
     * Get proposal state
     * @param {string} proposalId - Proposal ID
     */
    async getProposalState(proposalId) {
        if (!this.contract) {
            await this.initialize();
        }

        try {
            const proposal = await this.contract.proposals(proposalId);
            const state = await this.contract.state(proposalId);
            
            return {
                proposalId,
                proposer: proposal.proposer,
                startBlock: proposal.startBlock.toString(),
                endBlock: proposal.endBlock.toString(),
                executed: proposal.executed,
                state: state // 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Expired, 7=Executed
            };
        } catch (error) {
            console.error('Error getting proposal state:', error);
            throw error;
        }
    }

    /**
     * Check if proposal can be executed
     * @param {string} proposalId - Proposal ID
     */
    async canExecute(proposalId) {
        try {
            const state = await this.getProposalState(proposalId);
            // Proposal can be executed if state is Succeeded (4) or Queued (5)
            return state.state === 4 || state.state === 5;
        } catch (error) {
            console.error('Error checking if proposal can be executed:', error);
            return false;
        }
    }
}

/**
 * Helper function to get DAO voting service instance
 */
export function getDAOVotingService(contractAddress) {
    if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new DAOVotingService(contractAddress, provider);
    }
    throw new Error('Ethereum provider not available');
}

