import { getApiBaseUrl } from "../utils/apiConfig";
import { 
    getCachedData, 
    setCachedData, 
    removeCachedData
} from "../utils/cache";

const API_BASE_URL = getApiBaseUrl();

/**
 * Create a new registration session
 */
export async function createRegistrationSession(organisationId, address, useCache = true) {
    console.log("Creating registration session from frontend");

    if (!organisationId || !address) {
        throw new Error("Organisation ID and address are required");
    }

    const cacheKey = `session_org_${organisationId}`;
    
    // Try cache first
    if (useCache) {
        const cached = getCachedData(cacheKey, 60 * 1000); // 1 minute cache
        if (cached) {
            console.log("Session loaded from cache");
            return { success: true, session: cached, fromCache: true };
        }
    }

    // Get auth data
    const storedAuth = localStorage.getItem(`canopy_auth_${address.toLowerCase()}`);
    if (!storedAuth) {
        throw new Error("Authentication not found. Please sign in first.");
    }

    const authData = JSON.parse(storedAuth);
    if (!authData.signature || !authData.message) {
        throw new Error("Authentication data is incomplete");
    }

    const message = authData.message;
    const signature = String(authData.signature).trim();
    const authHeader = `Bearer ${address}:${message}:${signature}`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/registration-sessions/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
            },
            body: JSON.stringify({
                organisationId: organisationId
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errorData.error || errorData.message || "Failed to create session");
        }

        const data = await response.json();
        
        // Cache the session
        if (data.session) {
            setCachedData(cacheKey, data.session);
        }

        return { success: true, session: data.session, fromCache: false };
    } catch (err) {
        console.error("Error creating registration session:", err);
        throw err;
    }
}

/**
 * Get registration session details
 */
export async function getRegistrationSession(sessionId, useCache = true) {
    console.log("Getting registration session from frontend");

    if (!sessionId) {
        throw new Error("Session ID is required");
    }

    const cacheKey = `session_${sessionId}`;
    
    if (useCache) {
        const cached = getCachedData(cacheKey);
        if (cached) {
            console.log("Session loaded from cache");
            return { success: true, session: cached, fromCache: true };
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/registration-sessions/${sessionId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errorData.error || errorData.message || "Failed to get session");
        }

        const data = await response.json();
        
        if (data.session) {
            setCachedData(cacheKey, data.session);
        }

        return { success: true, session: data.session, fromCache: false };
    } catch (err) {
        console.error("Error getting registration session:", err);
        throw err;
    }
}

