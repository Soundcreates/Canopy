import { getApiBaseUrl } from "../utils/apiConfig";
import { 
  getCachedData, 
  setCachedData, 
  removeCachedData, 
  getProfileCacheKey 
} from "../utils/cache";

const API_BASE_URL = getApiBaseUrl();

export async function saveProfile(displayName, address) {
  console.log("Saving profile from frontend");

  if (!address) {
    throw new Error("Wallet not connected. Please connect your wallet first.");
  }

  // Fetch stored auth (signature and message) from localStorage
  console.log("Fetching stored auth (sig and msg) from localstorage");
  const storedAuth = localStorage.getItem(
    `canopy_auth_${address.toLowerCase()}`,
  );
  console.log("Stored auth: ", storedAuth);

  if (!storedAuth) {
    console.log("Authentication not found. Please sign in first.");
    throw new Error("Authentication not found. Please sign in first.");
  }

  let authData;
  try {
    console.log("Parsing stored auth");
    authData = JSON.parse(storedAuth);
  } catch (parseError) {
    console.error("Error parsing stored auth data:", parseError);
    throw new Error(
      "Invalid authentication data. Please sign in again by connecting your wallet and signing the message on the landing page.",
    );
  }

  if (!authData.signature || !authData.message) {
    console.error("Missing authentication fields. Stored auth data:", authData);
    throw new Error(
      "Authentication data is incomplete. Please sign in again by connecting your wallet and signing the message on the landing page.",
    );
  }

  // Validate and format signature
  let signature = authData.signature;
  signature = String(signature).trim();

  // Validate signature format: must start with '0x' and be hex
  if (!signature.startsWith("0x")) {
    console.error(
      "Invalid signature format - does not start with 0x:",
      signature,
    );
    throw new Error("Invalid signature format. Please sign in again.");
  }

  // Check signature length (should be 132 chars: 0x + 130 hex chars)
  if (signature.length < 130) {
    console.error("Invalid signature format - too short:", signature.length);
    throw new Error("Invalid signature format. Please sign in again.");
  }

  // Validate signature is hex string
  if (!/^0x[a-fA-F0-9]+$/.test(signature)) {
    console.error(
      "Invalid signature format - not a valid hex string:",
      signature,
    );
    throw new Error("Invalid signature format. Please sign in again.");
  }

  const authAddress = authData.address || address;
  const message = authData.message;

  // Format Authorization header: address:message:signature
  const authHeader = `Bearer ${authAddress}:${message}:${signature}`;
  console.log("Authorization header length:", authHeader.length);

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/updateProfile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        displayName: displayName,
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("Error response:", errorData);
      const errorMessage =
        errorData.error ||
        errorData.message ||
        `HTTP ${response.status}: Request failed`;
      throw new Error(errorMessage);
    }

    console.log("Successfully updated user's profile!");
    const data = await response.json();
    
    // Update cache with the new profile data
    if (data.user) {
      const cacheKey = getProfileCacheKey(address);
      setCachedData(cacheKey, data.user);
      console.log("Profile cache updated");
    }
    
    return { success: true, updatedUser: data.user };
  } catch (err) {
    console.error("Error updating profile", err);
    throw err;
  }
}

/**
 * Invalidate profile cache for a specific address
 * Useful when you know the profile has changed externally
 * @param {string} address - User wallet address
 */
export function invalidateProfileCache(address) {
  if (!address) return;
  const cacheKey = getProfileCacheKey(address);
  removeCachedData(cacheKey);
  console.log("Profile cache invalidated for", address);
}

export async function getUserProfile(address, useCache = true) {
  console.log("Getting userprofile from frontend");

  if (!address) {
    throw new Error("Wallet address is required");
  }

  const cacheKey = getProfileCacheKey(address);

  // Try to get from cache first
  if (useCache) {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log("Profile loaded from cache");
      return { success: true, userProfile: cachedData, fromCache: true };
    }
  }

  try {
    console.log("Fetching profile from API");
    const response = await fetch(
      `${API_BASE_URL}/api/profile/getProfile?address=${encodeURIComponent(address)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      // If 404 (user not found), don't cache the error
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({ error: "User not found" }));
        throw new Error(errorData.message || "User not found");
      }
      
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Request failed`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Cache the successful response
    if (data.user) {
      setCachedData(cacheKey, data.user);
      console.log("Profile cached for future use");
    }

    return { success: true, userProfile: data.user, fromCache: false };
  } catch (err) {
    console.error("Error getting user profile:", err);
    throw err;
  }
}
