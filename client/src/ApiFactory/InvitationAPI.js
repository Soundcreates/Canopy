import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

/**
 * Send an invitation to join an organization
 */
export const sendInvitation = async (walletAddress, signature, organisationId, inviteeAddress, role = 'user') => {
    try {
        const message = 'Canopy invitation verification';
        const response = await fetch(`${API_BASE_URL}/invitations/organisation/${organisationId}/invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                address: walletAddress,
                message: message,
                signature: signature,
                inviteeAddress,
                role
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send invitation');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending invitation:', error);
        throw error;
    }
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (walletAddress, signature, invitationId) => {
    try {
        const message = 'Canopy invitation acceptance';
        const response = await fetch(`${API_BASE_URL}/invitations/${invitationId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                address: walletAddress,
                message: message,
                signature: signature
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to accept invitation');
        }

        return await response.json();
    } catch (error) {
        console.error('Error accepting invitation:', error);
        throw error;
    }
};

/**
 * Reject an invitation
 */
export const rejectInvitation = async (walletAddress, signature, invitationId) => {
    try {
        const message = 'Canopy invitation rejection';
        const response = await fetch(`${API_BASE_URL}/invitations/${invitationId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                address: walletAddress,
                message: message,
                signature: signature
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reject invitation');
        }

        return await response.json();
    } catch (error) {
        console.error('Error rejecting invitation:', error);
        throw error;
    }
};

/**
 * Get user invitations
 */
export const getUserInvitations = async (walletAddress) => {
    try {
        const response = await fetch(`${API_BASE_URL}/invitations?address=${walletAddress}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get invitations');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting invitations:', error);
        throw error;
    }
};

