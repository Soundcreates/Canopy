import { getApiBaseUrl } from "../utils/apiConfig";

const API_BASE_URL = getApiBaseUrl();


export async function getTokenBalance(address, useCache = true) {
  if (!address) {
    throw new Error("Wallet address is required");
  }

  // Caching removed
  // if (useCache) { ... }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/token/balance?address=${encodeURIComponent(address)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Request failed`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Cache setting removed

    return {
      success: true,
      balance: data.balance,
      address: data.address,
      fromCache: false
    };
  } catch (err) {
    console.error("Error getting token balance:", err);
    throw err;
  }
}

/**
 * Get token balance history for a user
 * @param {string} address - User wallet address
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<{success: boolean, history: Array, address: string, fromCache?: boolean}>}
 */
export async function getTokenBalanceHistory(address, useCache = true) {
  if (!address) {
    throw new Error("Wallet address is required");
  }

  // Caching removed
  // if (useCache) { ... }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/token/history?address=${encodeURIComponent(address)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Request failed`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Cache setting removed

    return {
      success: true,
      history: data.history || [],
      address: data.address,
      fromCache: false
    };
  } catch (err) {
    console.error("Error getting token balance history:", err);
    throw err;
  }
}

// Helper to invalidate token cache

