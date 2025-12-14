import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import ForestRegistryData from '../contractData/ForestRegistry.json';

const ForestRegistryContext = createContext();

export const useForestRegistry = () => {
  const context = useContext(ForestRegistryContext);
  if (!context) {
    throw new Error('useForestRegistry must be used within a ForestRegistryProvider');
  }
  return context;
};

export const ForestRegistryProvider = ({ children }) => {
  const { signer, provider, isConnected } = useWallet();
  const [contract, setContract] = useState(null);
  const [readOnlyContract, setReadOnlyContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contract
  useEffect(() => {
    if (provider) {
      // Create read-only contract instance
      const readOnly = new ethers.Contract(
        ForestRegistryData.address,
        ForestRegistryData.abi,
        provider
      );
      setReadOnlyContract(readOnly);
    }

    if (signer) {
      // Create contract instance with signer for transactions
      const contractWithSigner = new ethers.Contract(
        ForestRegistryData.address,
        ForestRegistryData.abi,
        signer
      );
      setContract(contractWithSigner);
    } else {
      setContract(null);
    }
  }, [signer, provider, isConnected]);

  // Register a new forest
  const registerForest = async (area, geoHash) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.registerForest(area, geoHash);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to register forest';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Deactivate a forest
  const deactivateForest = async (forestId) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.deactivateForest(forestId);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to deactivate forest';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Transfer forest to new owner
  const transferForest = async (forestId, newOwner) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.transferForest(forestId, newOwner);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to transfer forest';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get forest count
  const getForestCount = async () => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const count = await readOnlyContract.forestCount();
      return Number(count);
    } catch (err) {
      setError(err.message || 'Failed to get forest count');
      throw err;
    }
  };

  // Get forest by ID
  const getForest = async (forestId) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const forest = await readOnlyContract.getForest(forestId);
      return {
        forestId: Number(forest.forestId),
        owner: forest.owner,
        area: Number(forest.area),
        geoHash: forest.geoHash,
        isActive: forest.isActive,
      };
    } catch (err) {
      setError(err.message || 'Failed to get forest');
      throw err;
    }
  };

  // Check if forest is active
  const isActive = async (forestId) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const active = await readOnlyContract.isActive(forestId);
      return active;
    } catch (err) {
      setError(err.message || 'Failed to check forest status');
      throw err;
    }
  };

  // Get owner's forests
  const getOwnerForests = async (ownerAddress) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const forests = await readOnlyContract.ownerForests(ownerAddress);
      return forests.map((id) => Number(id));
    } catch (err) {
      setError(err.message || 'Failed to get owner forests');
      throw err;
    }
  };

  // Get forest details by ID (from mapping)
  const getForestDetails = async (forestId) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const forest = await readOnlyContract.forests(forestId);
      return {
        forestId: Number(forest.forestId),
        owner: forest.owner,
        area: Number(forest.area),
        geoHash: forest.geoHash,
        isActive: forest.isActive,
      };
    } catch (err) {
      setError(err.message || 'Failed to get forest details');
      throw err;
    }
  };

  const value = {
    contract,
    readOnlyContract,
    isLoading,
    error,
    registerForest,
    deactivateForest,
    transferForest,
    getForestCount,
    getForest,
    isActive,
    getOwnerForests,
    getForestDetails,
    contractAddress: ForestRegistryData.address,
  };

  return (
    <ForestRegistryContext.Provider value={value}>
      {children}
    </ForestRegistryContext.Provider>
  );
};

