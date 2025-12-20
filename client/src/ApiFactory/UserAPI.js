const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Search users by display name or address
 */
export const searchUsers = async (query = '', limit = 50) => {
    try {
        const url = new URL(`${API_BASE_URL}/users/search`);
        if (query) {
            url.searchParams.append('query', query);
        }
        url.searchParams.append('limit', limit.toString());

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to search users');
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
};

