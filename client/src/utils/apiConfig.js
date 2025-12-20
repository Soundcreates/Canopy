export const getApiBaseUrl = () => {
    const MODE = import.meta.env.VITE_MODE || 'development';
    const baseUrl = MODE === 'production' 
        ? import.meta.env.VITE_BASE_URL_PROD 
        : import.meta.env.VITE_BASE_URL;
    
    // Fallback to localhost if not set
    return baseUrl || 'http://localhost:3000';
};

