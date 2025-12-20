import { getApiBaseUrl } from "../utils/apiConfig";
import { 
    getCachedData, 
    setCachedData, 
    removeCachedData,
    getOrganisationsCacheKey,
    getOrganisationCacheKey
} from "../utils/cache";

const API_BASE_URL = getApiBaseUrl();
console.log("API_BASE_URL", API_BASE_URL);

const fetchOrganisationById = async (account, orgId, useCache = true) => {
    console.log("Getting organisation by id from frontend");

    const cacheKey = getOrganisationCacheKey(orgId, account);
    
    // Try to get from cache first
    if (useCache) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            console.log("Organisation loaded from cache");
            return cachedData;
        }
    }

    try {
        // Add address as query parameter if provided (GET requests cannot have body)
        const url = account 
            ? `${API_BASE_URL}/api/organisations/${orgId}?address=${encodeURIComponent(account)}`
            : `${API_BASE_URL}/api/organisations/${orgId}`;
        
        console.log("Fetching organisation from API");
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // Check if response is JSON or HTML
            const contentType = response.headers.get('content-type');
            let errorData;
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
                throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Request failed`);
            } else {
                errorData = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }

        const data = await response.json();
        
        // Cache the organisation data
        setCachedData(cacheKey, data);
        console.log("Organisation cached for future use");
        
        return data;
    } catch (error) {
        console.error("Error getting organisation by id from frontend:", error);
        // Don't show toast for connection errors (server might not be running)
        if (error.message && error.message.includes('Failed to fetch')) {
            console.warn("Backend server appears to be offline. Please ensure the server is running on port 3000.");
        }
        throw error;
    }
}

const getOrganisations = async (account, useCache = true) => {
    console.log("Getting organisations from frontend");
    try {
        if (!account) {
            console.warn("No account provided, returning empty array");
            return { organisations: [] };
        }

        const cacheKey = getOrganisationsCacheKey(account);
        
        // Try to get from cache first
        if (useCache) {
            const cachedData = getCachedData(cacheKey);
            if (cachedData) {
                console.log("Organisations loaded from cache");
                return cachedData;
            }
        }

        const url = `${API_BASE_URL}/api/organisations?address=${encodeURIComponent(account)}`;
        console.log("Fetching organisations from API");
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // Check if response is JSON or HTML
            const contentType = response.headers.get('content-type');
            let errorData;
            if (contentType && contentType.includes('application/json')) {
                errorData = await response.json();
                throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Request failed`);
            } else {
                errorData = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }

        const data = await response.json();
        console.log("Organisations fetched: ", data);
        
        // Cache the organisations data
        setCachedData(cacheKey, data);
        console.log("Organisations cached for future use");
        
        return data;
        
    } catch (error) {
        console.error("Error getting organisations from frontend:", error);
        // Don't show toast for connection errors (server might not be running)
        if (error.message && error.message.includes('Failed to fetch')) {
            console.warn("Backend server appears to be offline. Please ensure the server is running on port 3000.");
        }
        throw error; // Re-throw so calling code knows it failed
    }
}

export { fetchOrganisationById, getOrganisations };