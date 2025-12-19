const { ethers } = require('ethers');
const { db } = require('../config/db');
const { GovernanceProposalModel, GovernanceVoteModel } = require('../models/index');
const { eq, and } = require('drizzle-orm');
const fs = require('fs');
const path = require('path');

/**
 * Governance Event Indexer
 * 
 * Listens to Governance contract events and stores them in the database.
 * Handles duplicate prevention and block tracking.
 */
class GovernanceIndexer {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.isRunning = false;
        this.lastProcessedBlock = null;
        this.pollInterval = null;
        this.listeners = [];
    }

    /**
     * Initialize the indexer with provider and contract
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

            console.log(`Governance Indexer initialized for contract: ${contractAddress}`);
            return true;
        } catch (error) {
            console.error('Error initializing Governance Indexer:', error);
            throw error;
        }
    }

    /**
     * Get the last processed block from database or start from a specific block
     */
    async getLastProcessedBlock() {
        try {
            // Get the highest block number from proposals
            const proposals = await db.select()
                .from(GovernanceProposalModel)
                .orderBy(GovernanceProposalModel.startBlock)
                .limit(1);

            if (proposals.length > 0) {
                // Start from the earliest proposal's start block minus some buffer
                return Math.max(0, proposals[0].startBlock - 1000);
            }

            // If no proposals, check if START_BLOCK is set
            const startBlock = process.env.GOVERNANCE_START_BLOCK;
            if (startBlock) {
                return parseInt(startBlock);
            }

            // Default: start from current block minus a safe buffer (e.g., last 1000 blocks)
            const currentBlock = await this.provider.getBlockNumber();
            return Math.max(0, currentBlock - 1000);
        } catch (error) {
            console.error('Error getting last processed block:', error);
            // Fallback to current block minus buffer
            const currentBlock = await this.provider.getBlockNumber();
            return Math.max(0, currentBlock - 1000);
        }
    }

    /**
     * Process ProposalCreated event
     */
    async handleProposalCreated(event) {
        try {
            const { proposalId, proposer, minNdviDelta, minConfidence, verificationIntervalDays, startBlock, endBlock } = event.args;

            // Check if proposal already exists
            const existing = await db.select()
                .from(GovernanceProposalModel)
                .where(eq(GovernanceProposalModel.proposalId, Number(proposalId)))
                .limit(1);

            if (existing.length > 0) {
                console.log(`Proposal ${proposalId} already exists, skipping`);
                return;
            }

            // Insert new proposal
            await db.insert(GovernanceProposalModel).values({
                proposalId: Number(proposalId),
                proposer: proposer.toLowerCase(),
                minNdviDelta: Number(minNdviDelta),
                minConfidence: Number(minConfidence),
                verificationIntervalDays: Number(verificationIntervalDays),
                startBlock: Number(startBlock),
                endBlock: Number(endBlock),
                executed: false,
            });

            console.log(`✓ Indexed ProposalCreated: proposalId=${proposalId}, proposer=${proposer}`);
        } catch (error) {
            console.error(`Error handling ProposalCreated event:`, error);
            throw error;
        }
    }

    /**
     * Process VoteCast event
     */
    async handleVoteCast(event) {
        try {
            const { proposalId, voter, support, weight } = event.args;

            // Check if vote already exists (proposalId + voter combination)
            const existing = await db.select()
                .from(GovernanceVoteModel)
                .where(
                    and(
                        eq(GovernanceVoteModel.proposalId, Number(proposalId)),
                        eq(GovernanceVoteModel.voter, voter.toLowerCase())
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                console.log(`Vote for proposal ${proposalId} by ${voter} already exists, skipping`);
                return;
            }

            // Insert new vote
            await db.insert(GovernanceVoteModel).values({
                proposalId: Number(proposalId),
                voter: voter.toLowerCase(),
                support: support,
                votingPower: Number(weight),
            });

            console.log(`✓ Indexed VoteCast: proposalId=${proposalId}, voter=${voter}, support=${support}, weight=${weight}`);
        } catch (error) {
            console.error(`Error handling VoteCast event:`, error);
            throw error;
        }
    }

    /**
     * Process ProposalExecuted event
     */
    async handleProposalExecuted(event) {
        try {
            const { proposalId } = event.args;
            const proposalIdNum = Number(proposalId);

            // Update proposal execution status
            await db.update(GovernanceProposalModel)
                .set({ executed: true })
                .where(eq(GovernanceProposalModel.proposalId, proposalIdNum));

            console.log(`✓ Indexed ProposalExecuted: proposalId=${proposalId}`);
        } catch (error) {
            console.error(`Error handling ProposalExecuted event:`, error);
            throw error;
        }
    }

    /**
     * Process historical events from a block range
     */
    async processHistoricalEvents(fromBlock, toBlock) {
        try {
            console.log(`Processing historical events from block ${fromBlock} to ${toBlock}`);

            // Get ProposalCreated events
            const proposalCreatedFilter = this.contract.filters.ProposalCreated();
            const proposalCreatedEvents = await this.contract.queryFilter(proposalCreatedFilter, fromBlock, toBlock);
            
            for (const event of proposalCreatedEvents) {
                await this.handleProposalCreated(event);
            }

            // Get VoteCast events
            const voteCastFilter = this.contract.filters.VoteCast();
            const voteCastEvents = await this.contract.queryFilter(voteCastFilter, fromBlock, toBlock);
            
            for (const event of voteCastEvents) {
                await this.handleVoteCast(event);
            }

            // Get ProposalExecuted events
            const proposalExecutedFilter = this.contract.filters.ProposalExecuted();
            const proposalExecutedEvents = await this.contract.queryFilter(proposalExecutedFilter, fromBlock, toBlock);
            
            for (const event of proposalExecutedEvents) {
                await this.handleProposalExecuted(event);
            }

            console.log(`Processed ${proposalCreatedEvents.length} ProposalCreated, ${voteCastEvents.length} VoteCast, ${proposalExecutedEvents.length} ProposalExecuted events`);
        } catch (error) {
            console.error('Error processing historical events:', error);
            throw error;
        }
    }

    /**
     * Start listening to new events
     */
    async startListening() {
        if (this.isRunning) {
            console.log('Governance Indexer is already running');
            return;
        }

        try {
            // Process historical events first
            const fromBlock = await this.getLastProcessedBlock();
            const currentBlock = await this.provider.getBlockNumber();
            
            if (fromBlock < currentBlock) {
                await this.processHistoricalEvents(fromBlock, currentBlock);
            }

            // Set up event listeners for new events
            // Note: ethers.js .on() passes decoded args directly, not the full event object
            this.contract.on('ProposalCreated', async (proposalId, proposer, minNdviDelta, minConfidence, verificationIntervalDays, startBlock, endBlock) => {
                // Create a mock event object with args for consistency
                const mockEvent = {
                    args: {
                        proposalId,
                        proposer,
                        minNdviDelta,
                        minConfidence,
                        verificationIntervalDays,
                        startBlock,
                        endBlock
                    }
                };
                await this.handleProposalCreated(mockEvent);
            });

            this.contract.on('VoteCast', async (proposalId, voter, support, weight) => {
                const mockEvent = {
                    args: {
                        proposalId,
                        voter,
                        support,
                        weight
                    }
                };
                await this.handleVoteCast(mockEvent);
            });

            this.contract.on('ProposalExecuted', async (proposalId) => {
                const mockEvent = {
                    args: {
                        proposalId
                    }
                };
                await this.handleProposalExecuted(mockEvent);
            });

            // Set up polling for missed events (backup mechanism)
            const pollIntervalMs = parseInt(process.env.GOVERNANCE_POLL_INTERVAL_MS || '30000'); // Default 30 seconds
            this.pollInterval = setInterval(async () => {
                try {
                    const currentBlock = await this.provider.getBlockNumber();
                    const fromBlock = this.lastProcessedBlock || await this.getLastProcessedBlock();
                    
                    if (currentBlock > fromBlock) {
                        await this.processHistoricalEvents(fromBlock + 1, currentBlock);
                        this.lastProcessedBlock = currentBlock;
                    }
                } catch (error) {
                    console.error('Error in polling interval:', error);
                }
            }, pollIntervalMs);

            this.isRunning = true;
            this.lastProcessedBlock = currentBlock;
            console.log('✓ Governance Indexer started and listening for events');
        } catch (error) {
            console.error('Error starting Governance Indexer:', error);
            throw error;
        }
    }

    /**
     * Stop listening to events
     */
    async stopListening() {
        if (!this.isRunning) {
            return;
        }

        try {
            // Remove all listeners
            this.contract.removeAllListeners('ProposalCreated');
            this.contract.removeAllListeners('VoteCast');
            this.contract.removeAllListeners('ProposalExecuted');

            // Clear polling interval
            if (this.pollInterval) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
            }

            this.isRunning = false;
            console.log('Governance Indexer stopped');
        } catch (error) {
            console.error('Error stopping Governance Indexer:', error);
            throw error;
        }
    }
}

// Export singleton instance
const governanceIndexer = new GovernanceIndexer();

module.exports = { governanceIndexer, GovernanceIndexer };

