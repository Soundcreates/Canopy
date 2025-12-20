import { getApiBaseUrl } from "../utils/apiConfig";

const API_BASE_URL = getApiBaseUrl();

//calls the backend to create new session
export async function createRegistrationSession(organisationId, address, useCache = true) {
    console.log("Creating registration session from frontend");

    if (!organisationId || !address) {
        throw new Error("Organisation ID and address are required");
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

        return { success: true, session: data.session, fromCache: false };
    } catch (err) {
        console.error("Error creating registration session:", err);
        throw err;
    }
}


export async function joinSession(sessionId, address) {
    console.log("Joining session from frontend");

    if (!sessionId) {
        console.log("No session id provided");
        return;
    }
    try {

        const response = await fetch(`${API_BASE_URL}/api/registration-sessions/join/${sessionId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                address: address
            })
        });

        const data = await response.json();
        if (data.success === true) {
            return { success: true, session: data.session };
        }
        return { success: false, session: null };
    } catch (err) {
        console.log("Error joining session:", err);
        throw err;
    }

}

//calls the backend to get active session
export async function getActiveRegistrationSession(organisationId) {
    console.log("Getting active registration session for org from frontend");

    if (!organisationId) {
        throw new Error("Organisation ID is required");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/registration-sessions/active/${organisationId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errorData.error || errorData.message || "Failed to get active session");
        }

        const data = await response.json();
        console.log("Organisation details: ", data);
        return { success: true, session: data.session };
    } catch (err) {
        console.error("Error getting active registration session:", err);
        throw err;
    }
}

//gets the registration session from backend
export async function getRegistrationSession(sessionIdOrOrgId, useCache = true) {
    console.log("Getting registration session from frontend");

    if (!sessionIdOrOrgId) {
        throw new Error("Session ID is required");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/registration-sessions/${sessionIdOrOrgId}`, {
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

        return { success: true, session: data.session, fromCache: false };
    } catch (err) {
        console.error("Error getting registration session:", err);
        throw err;
    }
}

/**
 * End a registration session
 */
export async function endRegistrationSession(sessionId, address) {
    console.log("Ending registration session from frontend");

    if (!sessionId || !address) {
        throw new Error("Session ID and address are required");
    }

    // Get auth data
    const storedAuth = localStorage.getItem(`canopy_auth_${address.toLowerCase()}`);
    if (!storedAuth) {
        throw new Error("Authentication not found. Please sign in first.");
    }

    const authData = JSON.parse(storedAuth);
    const message = authData.message;
    const signature = String(authData.signature).trim();
    const authHeader = `Bearer ${address}:${message}:${signature}`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/registration-sessions/${sessionId}/end`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errorData.error || errorData.message || "Failed to end session");
        }

        const data = await response.json();
        return { success: true, session: data.session };
    } catch (err) {
        console.error("Error ending registration session:", err);
        throw err;
    }
}
