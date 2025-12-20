import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../utils/apiConfig';
import { useWallet } from '../contexts/WalletContext';
import { useGovernance } from '../contexts/GovernanceContext';

export const useWebSocket = (sessionId, organisationId, address, isOwner = false) => {
    const [isConnected, setIsConnected] = useState(false);
    const [plotData, setPlotData] = useState(null);
    const [mapState, setMapState] = useState(null);
    const [votes, setVotes] = useState(new Map());
    const [members, setMembers] = useState([]);
    const [votingStatus, setVotingStatus] = useState(null);
    const [onChainProposalId, setOnChainProposalId] = useState(null);

    const socketRef = useRef(null);
    const hasJoinedRef = useRef(false);

    const { account, signer } = useWallet();
    const { vote: voteOnChain } = useGovernance();

    const API_BASE_URL = getApiBaseUrl();
    const WS_URL = API_BASE_URL.includes('/api')
        ? API_BASE_URL.replace('/api', '')
        : API_BASE_URL;

   //we only create socket one
    useEffect(() => {
        socketRef.current = io(WS_URL, {
            autoConnect: false,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            setIsConnected(true);

            if (hasJoinedRef.current) return;

            if (isOwner) {
                socket.emit('create-room', {
                    sessionId,
                    organisationId,
                    owner: address
                });
            } else {
                socket.emit('join-room', {
                    sessionId,
                    organisationId,
                    address
                });
            }

            hasJoinedRef.current = true;
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            hasJoinedRef.current = false;
        });

        socket.on('room-ready', () => {
            if (!isOwner) {
                socket.emit('join-room', {
                    sessionId,
                    organisationId,
                    address
                });
            }
        });

        socket.on('room-not-ready', () => {
            setTimeout(() => {
                socket.emit('join-room', {
                    sessionId,
                    organisationId,
                    address
                });
            }, 1000);
        });

        socket.on('room-joined', (data) => {
            setPlotData(data.plotData || null);
            setMembers(data.members || []);

            const voteMap = new Map();
            (data.votes || []).forEach(v => {
                voteMap.set(v.address, v);
            });
            setVotes(voteMap);
        });

        socket.on('room-created', (data) => {
            setMembers(data.members || []);
        });

        socket.on('member-joined', (data) => {
            setMembers(prev => {
                if (prev.find(m => m.address === data.address)) return prev;
                return [...prev, data];
            });
        });

        socket.on('member-left', (data) => {
            setMembers(prev => prev.filter(m => m.address !== data.address));
        });

        socket.on('plot-updated', (data) => {
            setPlotData(data.plotData);
        });

        socket.on('map-updated', (data) => {
            setMapState(data);
        });

        socket.on('vote-submitted', (data) => {
            setVotes(prev => {
                const next = new Map(prev);
                next.set(data.address, {
                    vote: data.vote,
                    timestamp: data.timestamp
                });
                return next;
            });
        });

        socket.on('voting-status', (data) => {
            setVotingStatus(data);
        });

        socket.on('voting-complete', (data) => {
            setVotingStatus(prev => ({
                ...prev,
                result: data.result
            }));
            if (data.proposalId) {
                setOnChainProposalId(data.proposalId);
            }
        });

        socket.on('trigger-onchain-vote', async ({ proposalId, address: voter, support }) => {
            if (
                account &&
                account.toLowerCase() === voter.toLowerCase() &&
                signer &&
                voteOnChain
            ) {
                const txHash = await voteOnChain(proposalId, support);
                socket.emit('onchain-vote-cast', {
                    proposalId,
                    address: voter,
                    txHash
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [WS_URL, sessionId, organisationId, address, isOwner, account, signer, voteOnChain]);

  
    useEffect(() => {
        if (!sessionId || !organisationId || !address) return;
        socketRef.current.connect();
    }, [sessionId, organisationId, address]);

    const sendPlotUpdate = useCallback((plotData) => {
        if (socketRef.current && isConnected && isOwner) {
            socketRef.current.emit('plot-update', { plotData });
        }
    }, [isConnected, isOwner]);

    const sendMapUpdate = useCallback((state) => {
        if (socketRef.current && isConnected && isOwner) {
            socketRef.current.emit('map-update', state);
        }
    }, [isConnected, isOwner]);

    const submitVote = useCallback((vote) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('submit-vote', { vote });
        }
    }, [isConnected]);

    return {
        isConnected,
        plotData,
        mapState,
        votes,
        members,
        votingStatus,
        onChainProposalId,
        sendPlotUpdate,
        sendMapUpdate,
        submitVote
    };
};
