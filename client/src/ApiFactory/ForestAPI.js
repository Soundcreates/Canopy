const API_BASE_URL = import.meta.env.VITE_BASE_URL;
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
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Request failed`);
        }

        console.log("Response is ok");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error registering forest from frontend:', error);
        throw error;
    }
};

export const getForests = async () => {
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
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Request failed`);

        }
        console.log("Response is ok");
        const data = await response.json();
        return {success: true, data: data};
    } catch (error) {
        console.error('Error getting forests:', error);
        throw error;
    }
}