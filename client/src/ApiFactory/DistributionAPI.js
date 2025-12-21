import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

/**
 * Distribute organization funds to all members
 */
export async function distributeOrganisationFunds(orgId) {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/api/distributions/organisation/${orgId}/distribute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to distribute funds');
        }

        return await response.json();
    } catch (error) {
        console.error('Error distributing funds:', error);
        throw error;
    }
}

/**
 * Get distribution status for an organization
 */
export async function getDistributionStatus(orgId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/distributions/organisation/${orgId}/status`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get distribution status');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting distribution status:', error);
        throw error;
    }
}

/**
 * Check if user can distribute organization funds
 */
export async function canDistribute(orgId) {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE_URL}/api/distributions/organisation/${orgId}/can-distribute`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to check distribution permission');
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking distribution permission:', error);
        throw error;
    }
}
