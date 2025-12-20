import { getApiBaseUrl } from '../utils/apiConfig';
import { getCachedData, setCachedData, getAuthCacheKey } from '../utils/cache';

const API_BASE_URL = getApiBaseUrl();

export const verifyAuth = async (address, message, signature, useCache = true) => {
    console.log('Verifying authentication...from frontend');
    console.log('Address:', address);
    console.log('Message:', message);
    console.log('Signature:', signature);
    
    // For auth verification, we can cache the result briefly (1 minute) since it's a POST
    // Cache key includes address only since message/signature change
    const cacheKey = getAuthCacheKey(address);
    
    if (useCache) {
        const cachedResult = getCachedData(cacheKey, 60 * 1000); // 1 minute cache for auth
        if (cachedResult !== null) {
            console.log('Auth verification result loaded from cache');
            return cachedResult;
        }
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address, message, signature }),
        });

        const result = response.status === 200;
        
        // Cache successful auth verification (only cache true, not false)
        if (result) {
            setCachedData(cacheKey, true);
            console.log('Auth verification result cached');
        }
        
        return result;
    } catch (error) {
        console.error('Error verifying authentication from frontend:', error);
        return false;
    }
}