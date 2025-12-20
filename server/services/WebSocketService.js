const { Server } = require('socket.io');
const { db } = require('../config/db');
const { RegistrationsSessionsModel } = require('../models/RegistrationsSessionsModel');
const { OrganisationMemberModel } = require('../models/OrganisationModel');
const { eq, and } = require('drizzle-orm');
const { governanceService } = require('./GovernanceService');

class WebSocketService {
    constructor() {
        this.io = null;
        this.rooms = new Map();
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.MODE === 'production'
                    ? process.env.FRONTEND_URL_PROD
                    : [
                        'http://localhost:5173',
                        'https://canopy-ai.vercel.app',
                        'https://canopy-chi.vercel.app'
                    ],
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.io.on('connection', (socket) => {
            console.log(` WS Connected: ${socket.id}`);

            socket.on('create-room', (data) => this.handleCreateRoom(socket, data));
            socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
            socket.on('plot-update', (data) => this.handlePlotUpdate(socket, data));
            socket.on('map-update', (data) => this.handleMapUpdate(socket, data));
            socket.on('submit-vote', (data) => this.handleSubmitVote(socket, data));
            socket.on('leave-room', () => this.handleLeaveRoom(socket));
            socket.on('onchain-vote-cast', (data) => this.handleOnChainVoteCast(socket, data));

            socket.on('disconnect', () => {
                this.handleLeaveRoom(socket);
                console.log(` WS Disconnected: ${socket.id}`);
            });
        });

        console.log(' WebSocket service initialized');
    }



    async handleCreateRoom(socket, data) {
        const { sessionId, organisationId, owner } = data;
        if (!sessionId || !organisationId || !owner) return;

        const roomId = `session_${sessionId}_org_${organisationId}`;

        try {
            const member = await db.select()
                .from(OrganisationMemberModel)
                .where(
                    and(
                        eq(OrganisationMemberModel.organisationId, organisationId),
                        eq(OrganisationMemberModel.userAddress, owner.toLowerCase())
                    )
                )
                .limit(1);

            if (!member.length || member[0].role !== 'owner') {
                socket.emit('error', { message: 'Only owners can create rooms' });
                return;
            }

            if (!this.rooms.has(roomId)) {
                let onChainProposalId = null;

                if (governanceService.initialized && governanceService.signer) {
                    try {
                        const proposal = await governanceService.createProposal(
                            owner.toLowerCase(),
                            302400
                        );
                        onChainProposalId = proposal.proposalId;
                    } catch (e) {
                        console.warn('⚠️ DAO proposal skipped');
                    }
                }

                this.rooms.set(roomId, {
                    sessionId,
                    organisationId,
                    owner: owner.toLowerCase(),
                    members: new Map(),
                    votes: new Map(),
                    plotData: null,
                    status: 'active',
                    onChainProposalId
                });
            }

            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.address = owner.toLowerCase();
            socket.data.role = 'owner';

            const room = this.rooms.get(roomId);

            room.members.set(socket.id, {
                address: owner.toLowerCase(),
                role: 'owner'
            });

            const orgMembers = await db.select()
                .from(OrganisationMemberModel)
                .where(eq(OrganisationMemberModel.organisationId, organisationId));

            socket.emit('room-created', {
                roomId,
                members: orgMembers.map(m => ({
                    address: m.userAddress,
                    role: m.role
                }))
            });

            socket.emit('room-ready', { roomId });

            console.log(` Room created: ${roomId}`);
        } catch (err) {
            console.error(' create-room error', err);
        }
    }



    async handleJoinRoom(socket, data) {
        const { sessionId, organisationId, address } = data;
        const roomId = `session_${sessionId}_org_${organisationId}`;

        const room = this.rooms.get(roomId);
        if (!room) {
            socket.emit('room-not-ready');
            return;
        }

        const member = await db.select()
            .from(OrganisationMemberModel)
            .where(
                and(
                    eq(OrganisationMemberModel.organisationId, organisationId),
                    eq(OrganisationMemberModel.userAddress, address.toLowerCase())
                )
            )
            .limit(1);

        if (!member.length) {
            socket.emit('error', { message: 'Not part of organization' });
            return;
        }

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.address = address.toLowerCase();
        socket.data.role = member[0].role;

        room.members.set(socket.id, {
            address: address.toLowerCase(),
            role: member[0].role
        });

        socket.emit('room-joined', {
            roomId,
            plotData: room.plotData,
            votes: Array.from(room.votes.entries()).map(([addr, v]) => ({
                address: addr,
                vote: v.vote,
                timestamp: v.timestamp
            })),
            members: Array.from(room.members.values())
        });

        socket.to(roomId).emit('member-joined', {
            address: address.toLowerCase(),
            role: member[0].role
        });

        console.log(`👤 Joined room: ${address}`);
    }


    handlePlotUpdate(socket, { plotData }) {
        const room = this.rooms.get(socket.data.roomId);
        if (!room || socket.data.role !== 'owner') return;

        room.plotData = plotData;

        socket.to(socket.data.roomId).emit('plot-updated', {
            plotData,
            updatedBy: socket.data.address
        });
    }

    handleMapUpdate(socket, mapState) {
        if (socket.data.role !== 'owner') return;
        socket.to(socket.data.roomId).emit('map-updated', mapState);
    }



    async handleSubmitVote(socket, { vote }) {
        const room = this.rooms.get(socket.data.roomId);
        if (!room || !['approve', 'reject'].includes(vote)) return;

        room.votes.set(socket.data.address, {
            vote,
            timestamp: new Date()
        });

        this.io.to(socket.data.roomId).emit('vote-submitted', {
            address: socket.data.address,
            vote,
            timestamp: new Date()
        });

        const approveVotes = [...room.votes.values()].filter(v => v.vote === 'approve').length;
        const rejectVotes = [...room.votes.values()].filter(v => v.vote === 'reject').length;
        const totalMembers = room.members.size;
        const votesCast = room.votes.size;

        const canSubmit = votesCast >= totalMembers/2; //very very very imp line
        const result = approveVotes > (totalMembers / 2) ? 'approved' :
            rejectVotes >= (totalMembers / 2) ? 'rejected' : null;

        this.io.to(socket.data.roomId).emit('voting-status', {
            approveVotes,
            rejectVotes,
            totalMembers,
            votesCount: room.votes.size,
            canSubmit,
            result
        });
    }


    handleOnChainVoteCast(socket, { proposalId, address, txHash }) {
        this.io.to(socket.data.roomId).emit('onchain-vote-cast', {
            proposalId,
            address,
            txHash,
            timestamp: new Date()
        });
    }


    handleLeaveRoom(socket) {
        const room = this.rooms.get(socket.data.roomId);
        if (!room) return;

        room.members.delete(socket.id);
        socket.leave(socket.data.roomId);

        socket.to(socket.data.roomId).emit('member-left', {
            address: socket.data.address
        });

        socket.data.roomId = null;
    }
}

module.exports = new WebSocketService();
