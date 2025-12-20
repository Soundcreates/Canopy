
// This file is now empty as all caching logic has been removed.
// It is kept to avoid import errors in case some modules still import it,
// though they shouldn't use any of its functions anymore.
// If your project build fails due to missing exports, you can either:
// 1. Remove the imports in the failing files.
// 2. Uncomment the dummy exports below.

// Dummy exports if needed for transition:
export const getCachedData = () => null;
export const setCachedData = () => { };
export const removeCachedData = () => { };
export const clearExpiredCache = () => { };
export const clearAllCache = () => { };
export const getProfileCacheKey = () => '';
export const getForestsCacheKey = () => '';
export const getForestCacheKey = () => '';
export const getNDVIDataCacheKey = () => '';
export const getNFTDataCacheKey = () => '';
export const getOrganisationsCacheKey = () => '';
export const getOrganisationCacheKey = () => '';
export const getAuthCacheKey = () => '';
export const getRegistrationSessionCacheKey = () => '';
export const getTokenBalanceCacheKey = () => '';
export const getTokenHistoryCacheKey = () => '';
export const invalidateOrganisationsCache = () => { };
