import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../utils/apiConfig';
import { useWallet } from '../contexts/WalletContext';
import { useGovernance } from '../contexts/GovernanceContext';

/**
 * Custom hook for WebSocket connection to registration sessions
 */
export const useWebSocket = (sessionId, organisationId, address, isOwner = false) => {
    const [isConnected, setIsConnected] = useState(false);
    const [roomState, setRoomState] = useState(null);
    const [plotData, setPlotData] = useState(null);
    const [votes, setVotes] = useState(new Map());
    const [members, setMembers] = useState([]);
    const [votingStatus, setVotingStatus] = useState(null);
    const [onChainProposalId, setOnChainProposalId] = useState(null);
    const socketRef = useRef(null);
    const { account, signer } = useWallet();
    const { vote: voteOnChain } = useGovernance();

    const API_BASE_URL = getApiBaseUrl();
    // WebSocket URL should be the base server URL without /api
    const WS_URL = API_BASE_URL.includes('/api') 
        ? API_BASE_URL.replace('/api', '') 
        : API_BASE_URL;

    useEffect(() => {
        if (!sessionId || !organisationId || !address) {
            return;
        }

        // Initialize socket connection
        socketRef.current = io(WS_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        const socket = socketRef.current;

        // Connection events
        socket.on('connect', () => {
            console.log('WebSocket connected');
            setIsConnected(true);

            // Create or join room based on role
            if (isOwner) {
                socket.emit('create-room', {
                    sessionId,
                    organisationId,
                    owner: address,
                    orgId: organisationId
                });
            } else {
                socket.emit('join-room', {
                    sessionId,
                    organisationId,
                    address
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);
        });

        // Room events
        socket.on('room-created', (data) => {
            console.log('Room created:', data);
            setRoomState(data);
            setMembers(data.members || []);
        });

        socket.on('room-joined', (data) => {
            console.log('Room joined:', data);
            setRoomState(data);
            setPlotData(data.plotData);
            setMembers(data.members || []);
            
            // Convert votes array to Map
            const votesMap = new Map();
            if (data.votes) {
                data.votes.forEach(vote => {
                    votesMap.set(vote.address, vote);
                });
            }
            setVotes(votesMap);
        });

        socket.on('member-joined', (data) => {
            console.log('Member joined:', data);
            setMembers(prev => {
                const exists = prev.find(m => m.address === data.address);
                if (!exists) {
                    return [...prev, data];
                }
                return prev;
            });
        });

        socket.on('member-left', (data) => {
            console.log('Member left:', data);
            setMembers(prev => prev.filter(m => m.address !== data.address));
        });

        // Plot events
        socket.on('plot-updated', (data) => {
            console.log('Plot updated:', data);
            setPlotData(data.plotData);
        });

        // Voting events
        socket.on('vote-submitted', (data) => {
            console.log('Vote submitted:', data);
            setVotes(prev => {
                const newVotes = new Map(prev);
                newVotes.set(data.address, {
                    vote: data.vote,
                    timestamp: data.timestamp
                });
                return newVotes;
            });
        });

        socket.on('voting-status', (data) => {
            console.log('Voting status:', data);
            setVotingStatus(data);
        });

        socket.on('voting-complete', (data) => {
            console.log('Voting complete:', data);
            setVotingStatus(prev => ({
                ...prev,
                result: data.result,
                status: data.result === 'approved' ? 'completed' : 'rejected'
            }));
            if (data.proposalId) {
                setOnChainProposalId(data.proposalId);
            }
        });

        // Listen for on-chain vote trigger
        socket.on('trigger-onchain-vote', async (data) => {
            console.log('Trigger on-chain vote:', data);
            const { proposalId, address: voterAddress, support } = data;
            
            // Only vote if this is for the current user and we have the vote function
            if (account && account.toLowerCase() === voterAddress.toLowerCase() && signer && voteOnChain) {
                try {
                    console.log(`Casting on-chain vote: Proposal=${proposalId}, Support=${support}`);
                    const txHash = await voteOnChain(proposalId, support);
                    console.log(`On-chain vote cast successfully: ${txHash}`);
                    
                    // Notify backend that vote was cast
                    socket.emit('onchain-vote-cast', {
                        proposalId,
                        address: voterAddress,
                        txHash
                    });
                } catch (error) {
                    console.error('Error casting on-chain vote:', error);
                    socket.emit('onchain-vote-error', {
                        proposalId,
                        address: voterAddress,
                        error: error.message
                    });
                }
            } else if (!voteOnChain) {
                console.warn('Governance vote function not available');
            }
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        // Cleanup on unmount
        return () => {
            if (socket) {
                socket.emit('leave-room', { sessionId, organisationId });
                socket.disconnect();
            }
        };
    }, [sessionId, organisationId, address, isOwner, WS_URL]);

    // Send plot update
    const sendPlotUpdate = useCallback((plotData) => {
        if (socketRef.current && isConnected && isOwner) {
            socketRef.current.emit('plot-update', { plotData });
        }
    }, [isConnected, isOwner]);

    // Submit vote
    const submitVote = useCallback((vote) => {
        if (socketRef.current && isConnected && !isOwner) {
            socketRef.current.emit('submit-vote', { vote });
        }
    }, [isConnected, isOwner]);

    // Leave room
    const leaveRoom = useCallback(() => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('leave-room', { sessionId, organisationId });
        }
    }, [isConnected, sessionId, organisationId]);

    return {
        isConnected,
        roomState,
        plotData,
        votes,
        members,
        votingStatus,
        onChainProposalId,
        sendPlotUpdate,
        submitVote,
        leaveRoom
    };
};

