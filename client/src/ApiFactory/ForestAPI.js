import { getApiBaseUrl } from '../utils/apiConfig';
import { 
    getCachedData, 
    setCachedData, 
    removeCachedData,
    getForestsCacheKey,
    getForestCacheKey,
    getNDVIDataCacheKey,
    getNFTDataCacheKey
} from '../utils/cache';

const API_BASE_URL = getApiBaseUrl();
console.log("API Base URL: ", API_BASE_URL);

export const registerForest = async (area, geoHash, account) => {
    console.log('Registering forest...from frontend');
    console.log("Checking for account: ", account);
    if (!account) {
        console.log("Wallet not connected");
        throw new Error('Wallet not connected');
    }
    console.log("Fetching stored auth (sig and msg) from localstorage");
    // Fetching the signature and message from localstorage
    const storedAuth = localStorage.getItem(`canopy_auth_${account.toLowerCase()}`);
    console.log("Stored auth: ", storedAuth);
    if (!storedAuth) {
        console.log("Authentication not found. Please sign in first.");
        throw new Error('Authentication not found. Please sign in first.');
    }

    let authData;
    try {
        authData = JSON.parse(storedAuth);
    } catch (parseError) {
        console.error('Error parsing stored auth data:', parseError);
        throw new Error('Invalid authentication data. Please sign in again by connecting your wallet and signing the message on the landing page.');
    }

    // Check if auth data has all required fields
    if (!authData.signature || !authData.message) {
        console.error('Missing authentication fields. Stored auth data:', authData);
        // Clear invalid auth data
        localStorage.removeItem(`canopy_auth_${account.toLowerCase()}`);
        throw new Error('Authentication data is incomplete. Please sign in again by connecting your wallet and signing the message on the landing page.');
    }

    // Validate and format signature
    let signature = authData.signature;

    // Ensure signature is a string and trim whitespace
    signature = String(signature).trim();

    // Validate signature format: must start with '0x' and be hex
    if (!signature.startsWith('0x')) {
        console.error('Invalid signature format - does not start with 0x:', signature);
        throw new Error('Invalid signature format. Please sign in again.');
    }

    // Check signature length (should be 132 chars: 0x + 130 hex chars)
    if (signature.length < 130) {
        console.error('Invalid signature format - too short:', signature.length);
        throw new Error('Invalid signature format. Please sign in again.');
    }

    // Validate signature is hex string
    if (!/^0x[a-fA-F0-9]+$/.test(signature)) {
        console.error('Invalid signature format - not a valid hex string:', signature);
        throw new Error('Invalid signature format. Please sign in again.');
    }

    // Validate address
    const address = authData.address || account;
    if (!address) {
        throw new Error('Address not found in authentication data');
    }

    // Validate message (already checked above, but keep for safety)
    const message = authData.message;

    console.log("Signature format validated successfully");
    console.log("Signature length:", signature.length);
    console.log("Signature starts with 0x:", signature.startsWith('0x'));

    try {
        console.log("Sending request to register forest");

        // Format Authorization header: address:message:signature
        // Note: message may contain special characters, so we ensure proper encoding
        const authHeader = `Bearer ${address}:${message}:${signature}`;

        console.log("Authorization header length:", authHeader.length);
        console.log("Address:", address);
        console.log("Message:", message);
        console.log("Signature (first 20 chars):", signature.substring(0, 20) + "...");

        const response = await fetch(`${API_BASE_URL}/api/forests/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({ area, geoHash, address: address }),
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
            console.log("Response is not ok");
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error("Error response:", errorData);
            const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Request failed`;
            throw new Error(errorMessage);
        }

        console.log("Response is ok");
        const data = await response.json();
        
        // Invalidate forests cache when a new forest is registered
        if (account) {
            const cacheKey = getForestsCacheKey(account);
            removeCachedData(cacheKey);
            console.log("Forests cache invalidated after registration");
        }
        
        return data;
    } catch (error) {
        console.error('Error registering forest from frontend:', error);
        throw error;
    }
};


export const requestNDVI = async (
    forest_id,
    min_lon,
    max_lon,
    min_lat,
    max_lat,
    options = {}
) => {
    console.log("ForestAPI: Starting NDVI computation request");
    console.log("ForestAPI: Forest ID:", forest_id);
    console.log("ForestAPI: Coordinates:", { min_lon, max_lon, min_lat, max_lat });

    // Validate required fields
    if (!forest_id || min_lon === undefined || max_lon === undefined || 
        min_lat === undefined || max_lat === undefined) {
        console.log("ForestAPI: Error - Missing required fields for NDVI request");
        throw new Error('forest_id, min_lon, max_lon, min_lat, and max_lat are required');
    }

    // Validate coordinates
    if (min_lon >= max_lon) {
        console.log("ForestAPI: Error - Invalid longitude range");
        throw new Error(`min_lon (${min_lon}) must be less than max_lon (${max_lon})`);
    }

    if (min_lat >= max_lat) {
        console.log("ForestAPI: Error - Invalid latitude range");
        throw new Error(`min_lat (${min_lat}) must be less than max_lat (${max_lat})`);
    }

    try {
        console.log("ForestAPI: Preparing NDVI request");
        const requestBody = {
            forest_id,
            min_lon,
            max_lon,
            min_lat,
            max_lat,
            epoch_start: options.epoch_start || new Date().toISOString().split('T')[0],
            epoch_end: options.epoch_end || new Date().toISOString().split('T')[0],
            carbon_tons: options.carbon_tons,
            area_hectares: options.area_hectares,
            status: options.status || 'ACTIVE'
        };

        console.log("ForestAPI: Sending POST request to /api/ndvi");
        const response = await fetch(`${API_BASE_URL}/api/ndvi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log("ForestAPI: Response status:", response.status);
        
        const data = await response.json();
        console.log("ForestAPI: Response data received");

        if (!response.ok) {
            console.log("ForestAPI: NDVI computation failed:", data.error || data.message);
            const errorMessage = data.error || data.message || `HTTP ${response.status}: NDVI computation failed`;
            throw new Error(errorMessage);
        }

        console.log("ForestAPI: NDVI computation completed successfully!");
        console.log("ForestAPI: NDVI value:", data.ndvi);
        console.log("ForestAPI: Confidence:", data.confidence);
        return data;
    } catch (error) {
        console.log("ForestAPI: Error during NDVI computation:", error);
        
        if (error.message) {
            throw error;
        }
        
        throw new Error(`Failed to compute NDVI: ${error.message}`);
    }
};


//this is the function that will be used to start NDVI monitoring every 3 hours
export const startNDVIMonitoring = (
    forest_id,
    min_lon,
    max_lon,
    min_lat,
    max_lat,
    options = {},
    onNDVIUpdate = null,
    onError = null
) => {
    console.log("ForestAPI: Starting NDVI monitoring for forest ID:", forest_id);
    console.log("ForestAPI: Monitoring interval: 3 hours (10800000 ms)");

    const INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

    // Create a function to make NDVI request
    const makeNDVIRequest = async () => {
        try {
            console.log("ForestAPI: Periodic NDVI request triggered");
            
            const result = await requestNDVI(
                forest_id,
                min_lon,
                max_lon,
                min_lat,
                max_lat,
                options
            );

            console.log("ForestAPI: Periodic NDVI update received");
            if (onNDVIUpdate) {
                onNDVIUpdate(result);
            }
        } catch (error) {
            console.log("ForestAPI: Error in periodic NDVI request:", error);
            if (onError) {
                onError(error);
            }
        }
    };

    // Make initial request
    console.log("ForestAPI: Making initial NDVI request");
    makeNDVIRequest();

    // Set up interval
    console.log("ForestAPI: Setting up 3-hour interval for NDVI monitoring");
    const intervalId = setInterval(makeNDVIRequest, INTERVAL_MS);

    // Return function to stop monitoring
    return () => {
        console.log("ForestAPI: Stopping NDVI monitoring");
        clearInterval(intervalId);
    };
};

/**
 * Fetches NDVI data for a specific forest
 * This is used for continuous fetching in components like VerificationTimeline
 * @param {number} forest_id - Forest ID
 * @returns {Promise<Object>} NDVI data from the database
 */
export const getNDVIData = async (forest_id, useCache = true) => {
    console.log("ForestAPI: Fetching NDVI data for forest ID:", forest_id);
    
    if (!forest_id) {
        console.log("ForestAPI: Error - Forest ID is required");
        throw new Error('Forest ID is required');
    }

    const cacheKey = getNDVIDataCacheKey(forest_id);
    
    // Try to get from cache first
    if (useCache) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            console.log("NDVI data loaded from cache");
            return cachedData;
        }
    }

    try {
        // Get account from localStorage auth data
        let account = null;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('canopy_auth_')) {
                const storedAuth = localStorage.getItem(key);
                if (storedAuth) {
                    try {
                        const authData = JSON.parse(storedAuth);
                        if (authData.address) {
                            account = authData.address;
                            break;
                        }
                    } catch (e) {
                        // Continue searching
                    }
                }
            }
        }

        if (!account) {
            throw new Error('Wallet not connected. Please sign in first.');
        }

        const storedAuth = localStorage.getItem(`canopy_auth_${account.toLowerCase()}`);
        if (!storedAuth) {
            throw new Error('Authentication not found. Please sign in first.');
        }

        const authData = JSON.parse(storedAuth);
        if (!authData.signature || !authData.message) {
            throw new Error('Authentication data is incomplete. Please sign in again.');
        }

        const address = authData.address || account;
        const message = authData.message;
        const signature = String(authData.signature).trim();
        const authHeader = `Bearer ${address}:${message}:${signature}`;

        console.log("ForestAPI: Sending GET request to fetch forest data");
        const response = await fetch(`${API_BASE_URL}/api/forests/getForests`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
        });

        console.log("ForestAPI: Response status:", response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error("ForestAPI: Error response:", errorData);
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Request failed`);
        }

        const data = await response.json();
        console.log("ForestAPI: Forest data received");

        // Backend returns {forests: [...]}, so we need to access data.forests
        const forests = data.forests || [];
        
        // Find the specific forest and return its NDVI data
        const forest = forests.find(f => f.forestId === forest_id) || null;
        
        if (!forest) {
            console.log("ForestAPI: Forest not found");
            return null;
        }

        console.log("ForestAPI: NDVI data retrieved successfully");
        const ndviData = {
            forestId: forest.forestId,
            lastNDVI: forest.lastNDVI,
            lastVerificationDate: forest.lastVerificationDate,
            forest: forest
        };
        
        // Cache the NDVI data
        setCachedData(cacheKey, ndviData);
        console.log("NDVI data cached for future use");
        
        return ndviData;
    } catch (error) {
        console.log("ForestAPI: Error fetching NDVI data:", error);
        throw error;
    }
};

/**
 * Fetches NFT metadata for a forest
 * @param {Object} forest - Forest object with latestTokenId and latestMetadataUri
 * @returns {Promise<Object>} NFT data including metadata from IPFS and contract data
 */
export const getForestNFTData = async (forest, useCache = true) => {
    console.log("ForestAPI: Fetching NFT data for forest:", forest.forestId);
    
    if (!forest) {
        console.log("ForestAPI: Error - Forest object is required");
        throw new Error('Forest object is required');
    }

    if (!forest.latestTokenId) {
        console.log("ForestAPI: No token ID found for forest:", forest.forestId);
        return null; // No NFT minted yet
    }

    const cacheKey = getNFTDataCacheKey(forest.forestId);
    
    // Try to get from cache first
    if (useCache) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData !== null) {
            console.log("NFT data loaded from cache");
            return cachedData;
        }
    }

    try {
        // Fetch metadata from IPFS
        let metadata = null;
        let imageUrl = null;
        
        if (forest.latestMetadataUri) {
            console.log("ForestAPI: Fetching metadata from IPFS URI:", forest.latestMetadataUri);
            
            // Extract IPFS hash from URI (handle both ipfs:// and direct hash)
            let ipfsHash = forest.latestMetadataUri;
            if (ipfsHash.startsWith('ipfs://')) {
                ipfsHash = ipfsHash.replace('ipfs://', '');
            }
            
            // Use Pinata gateway or public IPFS gateway
            const gatewayUrl = 'https://gateway.pinata.cloud';
            const metadataUrl = `${gatewayUrl}/ipfs/${ipfsHash}`;
            
            console.log("ForestAPI: Fetching metadata from:", metadataUrl);
            const metadataResponse = await fetch(metadataUrl);
            
            if (metadataResponse.ok) {
                metadata = await metadataResponse.json();
                console.log("ForestAPI: Metadata fetched successfully");
                
                // Extract image URL from metadata
                if (metadata.image) {
                    let imageHash = metadata.image;
                    if (imageHash.startsWith('ipfs://')) {
                        imageHash = imageHash.replace('ipfs://', '');
                    }
                    imageUrl = `${gatewayUrl}/ipfs/${imageHash}`;
                    console.log("ForestAPI: Image URL:", imageUrl);
                }
            } else {
                console.log("ForestAPI: Failed to fetch metadata, status:", metadataResponse.status);
            }
        }

        const nftData = {
            tokenId: forest.latestTokenId,
            forestId: forest.forestId,
            metadataUri: forest.latestMetadataUri,
            metadata: metadata,
            imageUrl: imageUrl,
            // Contract fields that we can get from the forest data
            owner: forest.owner,
            area: forest.area,
            lastNDVI: forest.lastNDVI,
            lastConfidence: forest.lastConfidence,
            lastVerificationDate: forest.lastVerificationDate,
            totalCarbonCredits: forest.totalCarbonCredits,
            txHash: forest.txHash,
            isActive: forest.isActive
        };
        
        // Cache the NFT data
        setCachedData(cacheKey, nftData);
        console.log("NFT data cached for future use");
        
        return nftData;
    } catch (error) {
        console.log("ForestAPI: Error fetching NFT data:", error);
        throw error;
    }
};

export const getForests = async (useCache = true) => {
    console.log("Getting forests");
    try {
        // Get account from localStorage auth data
        // Find the stored auth key to extract the account address
        let account = null;
    
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('canopy_auth_')) {
                const storedAuth = localStorage.getItem(key);
                if (storedAuth) {
                    try {
                        const authData = JSON.parse(storedAuth);
                        if (authData.address) {
                            account = authData.address;
                            break;
                        }
                    } catch (e) {
                        // Continue searching
                    }
                }
            }
        }

        console.log("Checking for account: ", account);
        if (!account) {
            console.log("Wallet not connected");
            throw new Error('Wallet not connected. Please sign in first.');
        }
        
        const cacheKey = getForestsCacheKey(account);
        
        // Try to get from cache first
        if (useCache) {
            const cachedData = getCachedData(cacheKey);
            if (cachedData) {
                console.log("Forests loaded from cache");
                return { success: true, data: cachedData, fromCache: true };
            }
        }
        
        console.log("Fetching stored auth (sig and msg) from localstorage");
        const storedAuth = localStorage.getItem(`canopy_auth_${account.toLowerCase()}`);
        console.log("Stored auth: ", storedAuth);
        if (!storedAuth) {
            console.log("Authentication not found. Please sign in first.");
            throw new Error('Authentication not found. Please sign in first.');
        }

        let authData;

        try {
            console.log("Parsing stored auth");
            authData = JSON.parse(storedAuth);
        } catch (parseError) {
            console.error('Error parsing stored auth data:', parseError);
            throw new Error('Invalid authentication data. Please sign in again by connecting your wallet and signing the message on the landing page.');
        }

        if (!authData.signature || !authData.message) {
            console.error('Missing authentication fields. Stored auth data:', authData);
            throw new Error('Authentication data is incomplete. Please sign in again by connecting your wallet and signing the message on the landing page.');
        }
        
        const address = authData.address;
        if (!address) {
            throw new Error('Address not found in authentication data');
        }

        const message = authData.message;
        const signature = authData.signature;
        const authHeader = `Bearer ${address}:${message}:${signature}`;
        console.log("Authorization header: ", authHeader);

        console.log("Fetching forests from API");
        const response = await fetch(`${API_BASE_URL}/api/forests/getForests`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
        });
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        if (!response.ok) {
            console.log("Response is not ok");
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error("Error response:", errorData);
            const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Request failed`;
            throw new Error(errorMessage);

        }
        console.log("Response is ok");
        const data = await response.json();
        console.log("ForestAPI: Raw response data:", data);
        console.log("ForestAPI: Data type:", typeof data);
        console.log("ForestAPI: Data.forests:", data.forests);
        console.log("ForestAPI: Is data.forests an array?", Array.isArray(data.forests));
        
        // Cache the forests data
        setCachedData(cacheKey, data);
        console.log("Forests data cached for future use");
        
        return {success: true, data: data, fromCache: false};
    } catch (error) {
        console.error('Error getting forests:', error);
        throw error;
    }
}