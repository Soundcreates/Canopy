/**
 * Get API base URL based on MODE environment variable
 * If MODE is 'production', uses VITE_BASE_URL_PROD
 * Otherwise, uses VITE_BASE_URL (development)
 */
export const getApiBaseUrl = () => {
    const MODE = import.meta.env.VITE_MODE || 'development';
    const baseUrl = MODE === 'production' 
        ? import.meta.env.VITE_BASE_URL_PROD 
        : import.meta.env.VITE_BASE_URL;
    
    // Fallback to localhost if not set
    return baseUrl || 'http://localhost:3000';
};

