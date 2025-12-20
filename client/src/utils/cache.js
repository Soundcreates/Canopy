
 // Simple caching utility using localStorage
 // Stores data with timestamps and expiration times
 

const CACHE_PREFIX = 'canopy_cache_';
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds


export const getCachedData = (key, maxAge = DEFAULT_CACHE_DURATION) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    const age = now - timestamp;

    // Check if cache has expired
    if (age > maxAge) {
      // Remove expired cache
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};


export const setCachedData = (key, data) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheValue = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheValue));
  } catch (error) {
    console.error('Error writing to cache:', error);
    // If storage is full, try to clear old cache entries
    if (error.name === 'QuotaExceededError') {
      clearExpiredCache();
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (retryError) {
        console.error('Failed to cache after clearing expired entries:', retryError);
      }
    }
  }
};


export const removeCachedData = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error removing from cache:', error);
  }
};

export const clearExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            const age = now - timestamp;
            if (age > DEFAULT_CACHE_DURATION) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
};

export const clearAllCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

export const getProfileCacheKey = (address) => {
  return `profile_${address.toLowerCase()}`;
};

export const getForestsCacheKey = (address) => {
  return `forests_${address.toLowerCase()}`;
};

export const getForestCacheKey = (forestId) => {
  return `forest_${forestId}`;
};

export const getNDVIDataCacheKey = (forestId) => {
  return `ndvi_${forestId}`;
};

export const getNFTDataCacheKey = (forestId) => {
  return `nft_${forestId}`;
};

export const getOrganisationsCacheKey = (address) => {
  return `organisations_${address ? address.toLowerCase() : 'all'}`;
};

export const getOrganisationCacheKey = (orgId, address) => {
  return `organisation_${orgId}_${address ? address.toLowerCase() : 'public'}`;
};

export const getAuthCacheKey = (address) => {
  return `auth_${address.toLowerCase()}`;
};

