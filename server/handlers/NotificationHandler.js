const { NotificationModel } = require('../models/NotificationModel');
const { UsersModel } = require('../models/UserModel');
const { db } = require('../config/db');
const { eq, and } = require('drizzle-orm');

/**
 * Get all notifications for a user
 */
async function getUserNotifications(req, res) {
    try {
        const userAddress = req.walletAddress || req.query.address;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Get user ID
        const user = await db.select()
            .from(UsersModel)
            .where(eq(UsersModel.address, userAddress.toLowerCase()))
            .limit(1);

        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const notifications = await db.select()
            .from(NotificationModel)
            .where(eq(NotificationModel.userAddress, userAddress.toLowerCase()))
            .orderBy(NotificationModel.createdAt);

        // Get unread count
        const unreadCount = notifications.filter(n => !n.read).length;

        return res.status(200).json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        return res.status(500).json({
            error: 'Failed to get notifications',
            details: error.message
        });
    }
}

/**
 * Mark notification as read
 */
async function markNotificationRead(req, res) {
    try {
        const { id } = req.params;
        const userAddress = req.walletAddress;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Verify notification belongs to user
        const notification = await db.select()
            .from(NotificationModel)
            .where(and(
                eq(NotificationModel.id, parseInt(id)),
                eq(NotificationModel.userAddress, userAddress.toLowerCase())
            ))
            .limit(1);

        if (notification.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Mark as read
        await db.update(NotificationModel)
            .set({ read: true })
            .where(eq(NotificationModel.id, parseInt(id)));

        return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({
            error: 'Failed to mark notification as read',
            details: error.message
        });
    }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsRead(req, res) {
    try {
        const userAddress = req.walletAddress;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        await db.update(NotificationModel)
            .set({ read: true })
            .where(eq(NotificationModel.userAddress, userAddress.toLowerCase()));

        return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({
            error: 'Failed to mark all notifications as read',
            details: error.message
        });
    }
}

module.exports = {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead
};

