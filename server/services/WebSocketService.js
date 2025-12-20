const { Server } = require('socket.io');
const { db } = require('../config/db');
const { RegistrationsSessionsModel } = require('../models/RegistrationsSessionsModel');
const { OrganisationMemberModel } = require('../models/OrganisationModel');
const { eq, and } = require('drizzle-orm');
const { governanceService } = require('./GovernanceService');

class WebSocketService {
    constructor() {
        this.io = null;
        this.rooms = new Map(); // roomId -> { owner, members, votes, plotData, status }
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.MODE === 'production' 
                    ? process.env.FRONTEND_URL_PROD 
                    : ['http://localhost:5173', 'https://canopy-ai.vercel.app', 'https://canopy-chi.vercel.app'],
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            // Join a registration room
            socket.on('join-room', async (data) => {
                await this.handleJoinRoom(socket, data);
            });

            // Owner creates a room
            socket.on('create-room', async (data) => {
                await this.handleCreateRoom(socket, data);
            });

            // Broadcast plot drawing updates
            socket.on('plot-update', (data) => {
                this.handlePlotUpdate(socket, data);
            });

            // Submit a vote
            socket.on('submit-vote', async (data) => {
                await this.handleSubmitVote(socket, data);
            });

            // Leave room
            socket.on('leave-room', (data) => {
                this.handleLeaveRoom(socket, data);
            });

            // On-chain vote cast confirmation
            socket.on('onchain-vote-cast', (data) => {
                this.handleOnChainVoteCast(socket, data);
            });

            // On-chain vote error
            socket.on('onchain-vote-error', (data) => {
                console.error('On-chain vote error:', data);
                socket.emit('error', { message: `Failed to cast on-chain vote: ${data.error}` });
            });

            // Disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });

        console.log('WebSocket service initialized');
    }

    async handleCreateRoom(socket, data) {
        const { sessionId, organisationId, owner, orgId } = data;
        
        if (!sessionId || !organisationId || !owner) {
            socket.emit('error', { message: 'Missing required fields: sessionId, organisationId, owner' });
            return;
        }

        try {
            // Verify owner is actually the owner of the organization
            const member = await db.select()
                .from(OrganisationMemberModel)
                .where(
                    and(
                        eq(OrganisationMemberModel.organisationId, organisationId),
                        eq(OrganisationMemberModel.userAddress, owner.toLowerCase())
                    )
                )
                .limit(1);

            if (member.length === 0 || member[0].role !== 'owner') {
                socket.emit('error', { message: 'Only organization owners can create rooms' });
                return;
            }

            const roomId = `session_${sessionId}_org_${organisationId}`;
            
            // Create or update registration session in database
            const existingSession = await db.select()
                .from(RegistrationsSessionsModel)
                .where(eq(RegistrationsSessionsModel.sessionId, sessionId))
                .limit(1);

            if (existingSession.length === 0) {
                await db.insert(RegistrationsSessionsModel).values({
                    sessionId: sessionId,
                    organisationId: organisationId,
                    owner: owner.toLowerCase(),
                    isActive: true,
                    endedAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
                });
            }

            // Create on-chain proposal when room is created
            let onChainProposalId = null;
            try {
                if (governanceService.initialized && governanceService.signer) {
                    const proposal = await governanceService.createProposal(owner.toLowerCase(), 302400); // 7 days voting period
                    onChainProposalId = proposal.proposalId;
                    console.log(`On-chain proposal created: ${onChainProposalId} for room ${roomId}`);
                } else {
                    console.log('Governance service not initialized or no signer, skipping on-chain proposal creation');
                }
            } catch (error) {
                console.error('Error creating on-chain proposal:', error);
                // Continue without on-chain proposal - frontend can handle it
            }

            // Initialize room
            this.rooms.set(roomId, {
                sessionId,
                organisationId,
                owner: owner.toLowerCase(),
                members: new Map(), // socketId -> { address, role, name }
                votes: new Map(), // address -> { vote: 'approve'|'reject', timestamp }
                onChainVotes: new Map(), // address -> { txHash, timestamp }
                plotData: null,
                status: 'active', // 'active', 'voting', 'completed', 'rejected'
                onChainProposalId, // Store proposal ID for on-chain voting
                createdAt: new Date()
            });

            // Join the room
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.role = 'owner';
            socket.data.address = owner.toLowerCase();

            // Add owner to members
            this.rooms.get(roomId).members.set(socket.id, {
                address: owner.toLowerCase(),
                role: 'owner',
                socketId: socket.id
            });

            // Get all organization members
            const orgMembers = await db.select()
                .from(OrganisationMemberModel)
                .where(eq(OrganisationMemberModel.organisationId, organisationId));

            socket.emit('room-created', {
                roomId,
                sessionId,
                members: orgMembers.map(m => ({
                    address: m.userAddress,
                    role: m.role
                }))
            });

            console.log(`Room created: ${roomId} by owner ${owner}`);
        } catch (error) {
            console.error('Error creating room:', error);
            socket.emit('error', { message: 'Failed to create room', error: error.message });
        }
    }

    async handleJoinRoom(socket, data) {
        const { sessionId, organisationId, address } = data;

        if (!sessionId || !organisationId || !address) {
            socket.emit('error', { message: 'Missing required fields: sessionId, organisationId, address' });
            return;
        }

        const roomId = `session_${sessionId}_org_${organisationId}`;
        const room = this.rooms.get(roomId);

        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        try {
            // Verify user is a member of the organization
            const member = await db.select()
                .from(OrganisationMemberModel)
                .where(
                    and(
                        eq(OrganisationMemberModel.organisationId, organisationId),
                        eq(OrganisationMemberModel.userAddress, address.toLowerCase())
                    )
                )
                .limit(1);

            if (member.length === 0) {
                socket.emit('error', { message: 'You are not a member of this organization' });
                return;
            }

            // Join the room
            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.role = member[0].role;
            socket.data.address = address.toLowerCase();

            // Add to members
            room.members.set(socket.id, {
                address: address.toLowerCase(),
                role: member[0].role,
                socketId: socket.id
            });

            // Send current room state to the new member
            socket.emit('room-joined', {
                roomId,
                sessionId,
                plotData: room.plotData,
                votes: Array.from(room.votes.entries()).map(([addr, vote]) => ({
                    address: addr,
                    vote: vote.vote,
                    timestamp: vote.timestamp
                })),
                members: Array.from(room.members.values()).map(m => ({
                    address: m.address,
                    role: m.role
                })),
                status: room.status
            });

            // Notify other members
            socket.to(roomId).emit('member-joined', {
                address: address.toLowerCase(),
                role: member[0].role
            });

            console.log(`Member ${address} joined room ${roomId}`);
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room', error: error.message });
        }
    }

    handlePlotUpdate(socket, data) {
        const { plotData } = data;
        const roomId = socket.data.roomId;

        if (!roomId) {
            socket.emit('error', { message: 'Not in a room' });
            return;
        }

        const room = this.rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        // Only owner can update plot
        if (socket.data.role !== 'owner') {
            socket.emit('error', { message: 'Only the owner can update the plot' });
            return;
        }

        // Update room plot data
        room.plotData = plotData;

        // Broadcast to all members except sender
        socket.to(roomId).emit('plot-updated', {
            plotData,
            updatedBy: socket.data.address,
            timestamp: new Date()
        });

        console.log(`Plot updated in room ${roomId} by ${socket.data.address}`);
    }

    async handleSubmitVote(socket, data) {
        const { vote } = data; // 'approve' or 'reject'
        const roomId = socket.data.roomId;

        if (!roomId) {
            socket.emit('error', { message: 'Not in a room' });
            return;
        }

        if (!vote || !['approve', 'reject'].includes(vote)) {
            socket.emit('error', { message: 'Invalid vote. Must be "approve" or "reject"' });
            return;
        }

        const room = this.rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        // Owner cannot vote
        if (socket.data.role === 'owner') {
            socket.emit('error', { message: 'Owner cannot vote on their own proposal' });
            return;
        }

        // Record vote
        room.votes.set(socket.data.address, {
            vote,
            timestamp: new Date()
        });

        // Broadcast vote to all members
        this.io.to(roomId).emit('vote-submitted', {
            address: socket.data.address,
            vote,
            timestamp: new Date()
        });

        // Trigger on-chain vote if proposal exists
        if (room.onChainProposalId) {
            this.io.to(roomId).emit('trigger-onchain-vote', {
                proposalId: room.onChainProposalId,
                address: socket.data.address,
                support: vote === 'approve' // true for approve, false for reject
            });
        }

        // Check if voting is complete
        await this.checkVotingComplete(roomId, room);

        console.log(`Vote ${vote} submitted by ${socket.data.address} in room ${roomId}`);
    }

    async checkVotingComplete(roomId, room) {
        // Get all organization members (excluding owner)
        const orgMembers = await db.select()
            .from(OrganisationMemberModel)
            .where(
                and(
                    eq(OrganisationMemberModel.organisationId, room.organisationId),
                    eq(OrganisationMemberModel.role, 'user') // Only count member votes, not owner
                )
            );

        const totalMembers = orgMembers.length;
        const votesCount = room.votes.size;
        const approveVotes = Array.from(room.votes.values()).filter(v => v.vote === 'approve').length;
        const rejectVotes = votesCount - approveVotes;

        // Check if majority has voted (more than 50%)
        const majorityThreshold = Math.ceil(totalMembers / 2);
        const hasMajority = votesCount >= majorityThreshold;

        // Check if all members have voted
        const allVoted = votesCount >= totalMembers;

        // Determine result
        let result = null;
        if (hasMajority || allVoted) {
            result = approveVotes > rejectVotes ? 'approved' : 'rejected';
            room.status = result === 'approved' ? 'completed' : 'rejected';
        }

        // Broadcast voting status
        this.io.to(roomId).emit('voting-status', {
            totalMembers,
            votesCount,
            approveVotes,
            rejectVotes,
            hasMajority,
            allVoted,
            result,
            status: room.status
        });

        // If voting is complete, trigger DAO on-chain voting
        if (result) {
            await this.triggerDAOVoting(roomId, room, result);
        }
    }

    async triggerDAOVoting(roomId, room, result) {
        console.log(`Voting complete for room ${roomId}. Result: ${result}`);
        
        // Emit event to trigger on-chain DAO voting
        this.io.to(roomId).emit('voting-complete', {
            result,
            sessionId: room.sessionId,
            organisationId: room.organisationId,
            proposalId: room.onChainProposalId,
            votes: Array.from(room.votes.entries()).map(([addr, vote]) => ({
                address: addr,
                vote: vote.vote
            })),
            onChainVotes: Array.from(room.onChainVotes.entries()).map(([addr, vote]) => ({
                address: addr,
                txHash: vote.txHash,
                timestamp: vote.timestamp
            }))
        });

        // If proposal exists, notify that on-chain voting can proceed
        if (room.onChainProposalId) {
            console.log(`On-chain proposal ${room.onChainProposalId} ready for execution if approved`);
        }
    }

    /**
     * Record on-chain vote transaction
     */
    recordOnChainVote(roomId, address, txHash) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.onChainVotes.set(address.toLowerCase(), {
                txHash,
                timestamp: new Date()
            });
        }
    }

    /**
     * Handle on-chain vote cast confirmation
     */
    handleOnChainVoteCast(socket, data) {
        const { proposalId, address, txHash } = data;
        const roomId = socket.data.roomId;

        if (!roomId) {
            socket.emit('error', { message: 'Not in a room' });
            return;
        }

        const room = this.rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        // Record the on-chain vote
        this.recordOnChainVote(roomId, address, txHash);

        // Broadcast to all members
        this.io.to(roomId).emit('onchain-vote-cast', {
            proposalId,
            address,
            txHash,
            timestamp: new Date()
        });

        console.log(`On-chain vote recorded: Proposal=${proposalId}, Address=${address}, TX=${txHash}`);
    }

    handleLeaveRoom(socket, data) {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = this.rooms.get(roomId);
        if (room) {
            room.members.delete(socket.id);
            socket.leave(roomId);
            
            // Notify other members
            socket.to(roomId).emit('member-left', {
                address: socket.data.address
            });
        }

        socket.data.roomId = null;
        socket.data.role = null;
        socket.data.address = null;
    }

    handleDisconnect(socket) {
        this.handleLeaveRoom(socket, {});
        console.log(`Client disconnected: ${socket.id}`);
    }

    // Get room state (for debugging/admin)
    getRoomState(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        return {
            sessionId: room.sessionId,
            organisationId: room.organisationId,
            owner: room.owner,
            memberCount: room.members.size,
            voteCount: room.votes.size,
            status: room.status,
            hasPlotData: !!room.plotData
        };
    }
}

const webSocketService = new WebSocketService();
module.exports = webSocketService;

