import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if MetaMask is installed
  const checkMetaMask = () => {
    if (typeof window.ethereum !== 'undefined') {
      return true;
    }
    return false;
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!checkMetaMask()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setIsConnected(true);

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      // Listen for chain changes
      window.ethereum.on('chainChanged', handleChainChanged);

      return address;
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setError(null);

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(address);
      } catch (err) {
        setError(err.message || 'Failed to update account'); }
    }
  };

  // Handle chain changes
  const handleChainChanged = () => {
    // Reload the page when chain changes
    window.location.reload();
  };

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (checkMetaMask()) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const address = await web3Signer.getAddress();

            setProvider(web3Provider);
            setSigner(web3Signer);
            setAccount(address);
            setIsConnected(true);

            // Set up event listeners
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
          }
        } catch (err) {
          console.error('Error checking connection:', err);
        }
      }
    };

    checkConnection();

    // Cleanup on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const value = {
    account,
    provider,
    signer,
    isConnected,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    checkMetaMask,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

