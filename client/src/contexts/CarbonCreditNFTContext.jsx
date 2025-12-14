import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import CarbonCreditNFTData from '../contractData/CarbonCreditNFT.json';

const CarbonCreditNFTContext = createContext();

export const useCarbonCreditNFT = () => {
  const context = useContext(CarbonCreditNFTContext);
  if (!context) {
    throw new Error('useCarbonCreditNFT must be used within a CarbonCreditNFTProvider');
  }
  return context;
};

export const CarbonCreditNFTProvider = ({ children }) => {
  const { signer, provider, isConnected } = useWallet();
  const [contract, setContract] = useState(null);
  const [readOnlyContract, setReadOnlyContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Health Status enum values
  const HealthStatus = {
    UNKNOWN: 0,
    HEALTHY: 1,
    DEGRADED: 2,
    INVALID: 3,
  };

  // Initialize contract
  useEffect(() => {
    if (provider) {
      // Create read-only contract instance
      const readOnly = new ethers.Contract(
        CarbonCreditNFTData.address,
        CarbonCreditNFTData.abi,
        provider
      );
      setReadOnlyContract(readOnly);
    }

    if (signer) {
      // Create contract instance with signer for transactions
      const contractWithSigner = new ethers.Contract(
        CarbonCreditNFTData.address,
        CarbonCreditNFTData.abi,
        signer
      );
      setContract(contractWithSigner);
    } else {
      setContract(null);
    }
  }, [signer, provider, isConnected]);

  // Mint a new carbon credit NFT (only owner)
  const mintCredit = async (to, forestId, initialTokenURI) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.mintCredit(to, forestId, initialTokenURI);
      await tx.wait();

      // Get the token ID from the transaction receipt
      const receipt = await provider.getTransactionReceipt(tx.hash);
      const tokenId = await contract.nextTokenId();

      return { hash: tx.hash, tokenId: Number(tokenId) };
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to mint credit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update health status (only oracle)
  const updateHealthStatus = async (forestId, newStatus) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.updateHealthStatus(forestId, newStatus);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to update health status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update metadata (only owner)
  const updateMetadata = async (tokenId, newUri) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.updateMetadata(tokenId, newUri);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to update metadata';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Set oracle address (only owner)
  const setOracle = async (newOracle) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.setOracle(newOracle);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to set oracle';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ERC721 Standard Functions

  // Get balance of an address
  const balanceOf = async (owner) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const balance = await readOnlyContract.balanceOf(owner);
      return Number(balance);
    } catch (err) {
      setError(err.message || 'Failed to get balance');
      throw err;
    }
  };

  // Get owner of a token
  const ownerOf = async (tokenId) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      return await readOnlyContract.ownerOf(tokenId);
    } catch (err) {
      setError(err.message || 'Failed to get owner');
      throw err;
    }
  };

  // Get token URI
  const tokenURI = async (tokenId) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      return await readOnlyContract.tokenURI(tokenId);
    } catch (err) {
      setError(err.message || 'Failed to get token URI');
      throw err;
    }
  };

  // Get next token ID
  const getNextTokenId = async () => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const tokenId = await readOnlyContract.nextTokenId();
      return Number(tokenId);
    } catch (err) {
      setError(err.message || 'Failed to get next token ID');
      throw err;
    }
  };

  // Get forest ID for a token
  const getTokenForest = async (tokenId) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const forestId = await readOnlyContract.tokenForest(tokenId);
      return Number(forestId);
    } catch (err) {
      setError(err.message || 'Failed to get token forest');
      throw err;
    }
  };

  // Get health status for a forest
  const getForestHealthStatus = async (forestId) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const status = await readOnlyContract.forestHealthStatus(forestId);
      return Number(status);
    } catch (err) {
      setError(err.message || 'Failed to get health status');
      throw err;
    }
  };

  // Get oracle address
  const getOracle = async () => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      return await readOnlyContract.oracle();
    } catch (err) {
      setError(err.message || 'Failed to get oracle address');
      throw err;
    }
  };

  // Transfer functions
  const transferFrom = async (from, to, tokenId) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.transferFrom(from, to, tokenId);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to transfer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const safeTransferFrom = async (from, to, tokenId, data = '0x') => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.safeTransferFrom(from, to, tokenId, data);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to safe transfer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Approval functions
  const approve = async (to, tokenId) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.approve(to, tokenId);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to approve';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const setApprovalForAll = async (operator, approved) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.setApprovalForAll(operator, approved);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to set approval for all';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getApproved = async (tokenId) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      return await readOnlyContract.getApproved(tokenId);
    } catch (err) {
      setError(err.message || 'Failed to get approved address');
      throw err;
    }
  };

  const isApprovedForAll = async (owner, operator) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      return await readOnlyContract.isApprovedForAll(owner, operator);
    } catch (err) {
      setError(err.message || 'Failed to check approval');
      throw err;
    }
  };

  // Get contract name and symbol
  const getName = async () => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      return await readOnlyContract.name();
    } catch (err) {
      setError(err.message || 'Failed to get name');
      throw err;
    }
  };

  const getSymbol = async () => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      return await readOnlyContract.symbol();
    } catch (err) {
      setError(err.message || 'Failed to get symbol');
      throw err;
    }
  };

  const value = {
    contract,
    readOnlyContract,
    isLoading,
    error,
    HealthStatus,
    // Custom functions
    mintCredit,
    updateHealthStatus,
    updateMetadata,
    setOracle,
    // ERC721 functions
    balanceOf,
    ownerOf,
    tokenURI,
    getNextTokenId,
    getTokenForest,
    getForestHealthStatus,
    getOracle,
    transferFrom,
    safeTransferFrom,
    approve,
    setApprovalForAll,
    getApproved,
    isApprovedForAll,
    getName,
    getSymbol,
    contractAddress: CarbonCreditNFTData.address,
  };

  return (
    <CarbonCreditNFTContext.Provider value={value}>
      {children}
    </CarbonCreditNFTContext.Provider>
  );
};

