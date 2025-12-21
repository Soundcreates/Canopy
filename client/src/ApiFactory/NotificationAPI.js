import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

/**
 * Get user notifications
 */
export const getUserNotifications = async (walletAddress) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications?address=${walletAddress}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get notifications');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting notifications:', error);
        throw error;
    }
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (walletAddress, signature, notificationId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Wallet-Address': walletAddress,
                'X-Signature': signature
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to mark notification as read');
        }

        return await response.json();
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (walletAddress, signature) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Wallet-Address': walletAddress,
                'X-Signature': signature
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to mark all notifications as read');
        }

        return await response.json();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

