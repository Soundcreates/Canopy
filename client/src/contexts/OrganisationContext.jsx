import { createContext, useContext, useState } from 'react';
import { useWallet } from './WalletContext';
import { getApiBaseUrl } from '../utils/apiConfig';

const OrganisationContext = createContext();

export const useOrganisation = () => {
  const context = useContext(OrganisationContext);
  if (!context) {
    throw new Error('useOrganisation must be used within an OrganisationProvider');
  }
  return context;
};

// Get API base URL (without /api suffix - we'll add it when needed)
const API_BASE_URL = getApiBaseUrl();

export const OrganisationProvider = ({ children }) => {
  const { account, signer } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to sign a message and get signature
  const signMessage = async (message) => {
    if (!signer) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    try {
      const signature = await signer.signMessage(message);
      return signature;
    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Signature request rejected by user');
      }
      throw new Error('Failed to sign message: ' + err.message);
    }
  };

  // Helper function to make authenticated API requests
  // Only signs message for write operations (POST, PUT, DELETE)
  const makeAuthenticatedRequest = async (endpoint, method = 'GET', body = null, requiresSignature = false) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // For GET requests, just send address (no signature required)
    if (method === 'GET' || method === 'HEAD') {
      // Add address as query parameter
      const separator = endpoint.includes('?') ? '&' : '?';
      const urlWithParams = `${API_BASE_URL}/api${endpoint}${separator}address=${encodeURIComponent(account)}`;
      const response = await fetch(urlWithParams, fetchOptions);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: Request failed`);
      }
      return data;
    }
    // For write operations (POST, PUT, DELETE), require signature
    else if (requiresSignature || method !== 'GET') {
      if (!signer) {
        throw new Error('Wallet signer not available. Please connect your wallet.');
      }

      const message = 'Canopy verification login';
      const signature = await signMessage(message);

      const requestBody = {
        address: account,
        message: message,
        signature: signature,
        ...(body && body)
      };
      fetchOptions.body = JSON.stringify(requestBody);

      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, fetchOptions);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: Request failed`);
      }
      return data;
    }
  };

  // Create a new organisation
  const createOrganisation = async (organisationData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { name, description, startDate, endDate, image, owners, users } = organisationData;

      // Convert image file to base64 if provided
      let imageBase64 = null;
      if (image && image instanceof File) {
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
      } else if (image) {
        imageBase64 = image;
      }

      const data = await makeAuthenticatedRequest(
        '/organisations/create',
        'POST',
        {
          name,
          description,
          startDate,
          endDate,
          image: imageBase64,
          owners: owners || [],
          users: users || []
        },
        true // Requires signature
      );

      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create organisation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get all organisations for the authenticated user - NO SIGNATURE REQUIRED
  const getOrganisations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await makeAuthenticatedRequest('/organisations', 'GET', null, false);
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch organisations';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get a specific organisation by ID - NO SIGNATURE REQUIRED
  const getOrganisationById = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await makeAuthenticatedRequest(`/organisations/${id}`, 'GET', null, false);
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch organisation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an organisation
  const updateOrganisation = async (id, updateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await makeAuthenticatedRequest(
        `/organisations/${id}`,
        'PUT',
        updateData,
        true // Requires signature
      );
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update organisation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add members to an organisation
  const addMembers = async (id, members) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await makeAuthenticatedRequest(
        `/organisations/${id}/members`,
        'POST',
        members,
        true // Requires signature
      );
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to add members';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a member from an organisation
  const removeMember = async (id, memberAddress) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await makeAuthenticatedRequest(
        `/organisations/${id}/members/${memberAddress}`,
        'DELETE',
        null,
        true // Requires signature
      );
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to remove member';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an organisation (soft delete)
  const deleteOrganisation = async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await makeAuthenticatedRequest(
        `/organisations/${id}`,
        'DELETE',
        null,
        true // Requires signature
      );
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete organisation';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get marketplace organisations (public, no auth required)
  const getMarketplaceOrganisations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/organisations/marketplace`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: Request failed`);
      }
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch marketplace organisations';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    createOrganisation,
    getOrganisations,
    getOrganisationById,
    updateOrganisation,
    addMembers,
    removeMember,
    deleteOrganisation,
    getMarketplaceOrganisations,
    isLoading,
    error,
  };

  return (
    <OrganisationContext.Provider value={value}>
      {children}
    </OrganisationContext.Provider>
  );
};

