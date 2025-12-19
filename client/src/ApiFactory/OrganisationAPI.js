import { showToast } from "../utils/toast";
import { getApiBaseUrl } from "../utils/apiConfig";

const API_BASE_URL = getApiBaseUrl();
console.log("API_BASE_URL", API_BASE_URL);

const fetchOrganisationById = async (account, orgId) => {
    console.log("Getting organisation by id from frontend");

    try {
        // Add address as query parameter if provided (GET requests cannot have body)
        const url = account 
            ? `${API_BASE_URL}/api/organisations/${orgId}?address=${encodeURIComponent(account)}`
            : `${API_BASE_URL}/api/organisations/${orgId}`;
        
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
        showToast.success("Organisation fetched successfully ");
        return data;
    } catch (error) {
        console.error("Error getting organisation by id from frontend:", error);
        // Don't show toast for connection errors (server might not be running)
        if (error.message && error.message.includes('Failed to fetch')) {
            console.warn("Backend server appears to be offline. Please ensure the server is running on port 3000.");
        } else {
            showToast.error("Error getting organisation details", error.message || error);
        }
        throw error;
    }
}

const getOrganisations = async (account) => {
    console.log("Getting organisations from frontend");
    try {
        if (!account) {
            console.warn("No account provided, returning empty array");
            return { organisations: [] };
        }

        const url = `${API_BASE_URL}/api/organisations?address=${encodeURIComponent(account)}`;
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
        return data;
        
    } catch (error) {
        console.error("Error getting organisations from frontend:", error);
        // Don't show toast for connection errors (server might not be running)
        if (error.message && error.message.includes('Failed to fetch')) {
            console.warn("Backend server appears to be offline. Please ensure the server is running on port 3000.");
        } else {
            showToast.error("Error getting organisations", error.message || error);
        }
        throw error; // Re-throw so calling code knows it failed
    }
}

export { fetchOrganisationById, getOrganisations };