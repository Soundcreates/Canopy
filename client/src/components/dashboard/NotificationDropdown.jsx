import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../../contexts/WalletContext';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '../../ApiFactory/NotificationAPI';
import { acceptInvitation, rejectInvitation } from '../../ApiFactory/InvitationAPI';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import CTKTokenData from '../../contractData/CTKToken.json';
import { toast } from 'react-toastify';

const INVITATION_COST = 20; // 20 tokens

const NotificationDropdown = () => {
    const { account, signer, provider } = useWallet();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        if (account && isOpen) {
            loadNotifications();
        }
    }, [account, isOpen]);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        if (!account) return;

        const interval = setInterval(() => {
            loadNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [account]);

    const loadNotifications = async () => {
        if (!account) return;

        try {
            const response = await getUserNotifications(account);
            setNotifications(response.notifications || []);
            setUnreadCount(response.unreadCount || 0);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const handleMarkRead = async (notificationId) => {
        if (!account || !signer) return;

        try {
            const message = 'Canopy notification read';
            const signature = await signer.signMessage(message);
            await markNotificationRead(account, signature, notificationId);
            await loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        if (!account || !signer) return;

        try {
            const message = 'Canopy mark all notifications read';
            const signature = await signer.signMessage(message);
            await markAllNotificationsRead(account, signature);
            await loadNotifications();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const checkTokenBalance = async () => {
        if (!provider || !account) return false;

        try {
            const tokenContract = new ethers.Contract(
                CTKTokenData.address,
                CTKTokenData.abi,
                provider
            );
            const balance = await tokenContract.balanceOf(account);
            const decimals = await tokenContract.decimals();
            const balanceFormatted = ethers.formatUnits(balance, decimals);
            return parseFloat(balanceFormatted) >= INVITATION_COST;
        } catch (error) {
            console.error('Error checking token balance:', error);
            return false;
        }
    };

    const payTokens = async () => {
        if (!signer || !account) {
            throw new Error('Wallet not connected');
        }

        try {
            const tokenContract = new ethers.Contract(
                CTKTokenData.address,
                CTKTokenData.abi,
                signer
            );

            // Check balance first
            const balance = await tokenContract.balanceOf(account);
            const decimals = await tokenContract.decimals();
            const balanceFormatted = ethers.formatUnits(balance, decimals);

            if (parseFloat(balanceFormatted) < INVITATION_COST) {
                throw new Error(`Insufficient tokens. You need ${INVITATION_COST} tokens but only have ${parseFloat(balanceFormatted).toFixed(2)}`);
            }

            // Transfer tokens to a burn address or treasury (using zero address as burn for now)
            // In production, you might want to use a treasury address
            const burnAddress = '0x0000000000000000000000000000000000000000';
            const amount = ethers.parseUnits(INVITATION_COST.toString(), decimals);

            const tx = await tokenContract.transfer(burnAddress, amount);
            await tx.wait();

            return true;
        } catch (error) {
            console.error('Error paying tokens:', error);
            throw error;
        }
    };

    const handleAcceptInvitation = async (notification) => {
        if (!account || !signer) {
            toast.error('Please connect your wallet');
            return;
        }

        if (processingId === notification.id) return;
        setProcessingId(notification.id);

        try {
            // Check token balance
            const hasEnoughTokens = await checkTokenBalance();
            if (!hasEnoughTokens) {
                toast.error(`You need ${INVITATION_COST} tokens to accept/reject invitations`);
                return;
            }

            // Pay tokens
            await payTokens();

            // Sign and accept invitation
            const message = 'Canopy invitation acceptance';
            const signature = await signer.signMessage(message);
            await acceptInvitation(account, signature, notification.relatedEntityId);

            // Mark notification as read
            await handleMarkRead(notification.id);

            toast.success('Invitation accepted!', { position: 'top-right' });
            await loadNotifications();
        } catch (error) {
            console.error('Error accepting invitation:', error);
            toast.error(error.message || 'Failed to accept invitation', { position: 'top-right' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectInvitation = async (notification) => {
        if (!account || !signer) {
            toast.error('Please connect your wallet');
            return;
        }

        if (processingId === notification.id) return;
        setProcessingId(notification.id);

        try {
            // Check token balance
            const hasEnoughTokens = await checkTokenBalance();
            if (!hasEnoughTokens) {
                toast.error(`You need ${INVITATION_COST} tokens to accept/reject invitations`);
                return;
            }

            // Pay tokens
            await payTokens();

            // Sign and reject invitation
            const message = 'Canopy invitation rejection';
            const signature = await signer.signMessage(message);
            await rejectInvitation(account, signature, notification.relatedEntityId);

            // Mark notification as read
            await handleMarkRead(notification.id);

            toast.success('Invitation rejected', { position: 'top-right' });
            await loadNotifications();
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            toast.error(error.message || 'Failed to reject invitation', { position: 'top-right' });
        } finally {
            setProcessingId(null);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-96 bg-[#11141a] border border-white/10 rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-sm font-medium text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No notifications
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-white/5 transition-colors ${
                                                    !notification.read ? 'bg-emerald-500/5' : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-none"></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] text-gray-500 font-mono">
                                                                {formatTime(notification.createdAt)}
                                                            </span>
                                                            {notification.type === 'invitation' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleAcceptInvitation(notification)}
                                                                        disabled={processingId === notification.id}
                                                                        className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/20 font-mono disabled:opacity-50"
                                                                    >
                                                                        {processingId === notification.id ? 'Processing...' : `Accept (${INVITATION_COST} tokens)`}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejectInvitation(notification)}
                                                                        disabled={processingId === notification.id}
                                                                        className="text-[10px] px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/20 font-mono disabled:opacity-50"
                                                                    >
                                                                        {processingId === notification.id ? 'Processing...' : `Reject (${INVITATION_COST} tokens)`}
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;

