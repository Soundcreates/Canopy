/**
 * DEV / HACKATHON TEST PAGE — NOT FOR PRODUCTION
 * 
 * This is a developer-only console for testing wallet signature authentication
 * and protected backend routes during development.
 * 
 * Features:
 * - MetaMask wallet connection
 * - Message signing with ethers.js v6
 * - Backend API testing (POST /auth/verify, POST /forests)
 * - Request/response logging
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Backend API base URL - adjust if needed
const API_BASE_URL = 'http://localhost:3000/api';

function DevConsole() {
  // Wallet connection state
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Message signing state
  const [message, setMessage] = useState('Canopy verification login');
  const [signature, setSignature] = useState(null);
  const [isSigning, setIsSigning] = useState(false);

  // API request state
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Request/response log
  const [logHistory, setLogHistory] = useState([]);

  // Set black background on body/html on mount
  useEffect(() => {
    // Force black background on body and html
    document.body.style.backgroundColor = '#000000';
    document.body.style.color = '#ffffff';
    document.documentElement.style.backgroundColor = '#000000';
    
    // Cleanup on unmount (optional, but good practice)
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  // Check for MetaMask on mount
  useEffect(() => {
    const checkMetaMask = () => {
      const hasMM = typeof window.ethereum !== 'undefined';
      setHasMetaMask(hasMM);
      
      if (hasMM) {
        console.log('MetaMask detected');
        // Check if already connected
        window.ethereum.request({ method: 'eth_accounts' })
          .then(accounts => {
            if (accounts.length > 0) {
              connectWallet();
            }
          })
          .catch(err => console.error('Error checking accounts:', err));
      } else {
        console.warn('MetaMask not detected');
      }
    };

    checkMetaMask();
  }, []);

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    if (!hasMetaMask) {
      setError('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access from MetaMask
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Create ethers.js v6 BrowserProvider
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);

      console.log('Wallet connected:', address);

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle account changes in MetaMask
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setSignature(null);
    } else {
      // Account changed, reconnect
      connectWallet();
    }
  };

  // Sign the message using the connected wallet
  const signMessage = async () => {
    if (!signer) {
      setError('Please connect your wallet first');
      return;
    }

    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      // Sign the message using ethers.js v6 signer
      // This will prompt MetaMask to show a signing dialog
      const signedMessage = await signer.signMessage(message);
      
      setSignature(signedMessage);
      console.log('Message signed:', {
        address: account,
        message: message,
        signature: signedMessage
      });

      addLog('SIGN', 'Message signed successfully', {
        address: account,
        message: message,
        signature: signedMessage
      });
    } catch (err) {
      console.error('Error signing message:', err);
      setError(err.message || 'Failed to sign message');
      
      // User rejected the signature request
      if (err.code === 4001) {
        setError('Signature request rejected by user');
      }
    } finally {
      setIsSigning(false);
    }
  };

  // Test POST /auth/verify endpoint
  const testAuthVerify = async () => {
    if (!account || !message || !signature) {
      setError('Please connect wallet and sign a message first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const requestBody = {
        address: account,
        message: message,
        signature: signature
      };

      console.log('Testing POST /auth/verify:', requestBody);

      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${data.message || 'Request failed'}`);
      }

      setApiResponse(data);
      addLog('API', `POST /auth/verify - ${response.status}`, {
        request: requestBody,
        response: data
      });

      console.log('Auth verify response:', data);
    } catch (err) {
      console.error('Error testing auth verify:', err);
      setError(err.message || 'Failed to verify signature');
      addLog('ERROR', 'POST /auth/verify failed', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Test POST /forests endpoint (protected route)
  const testForests = async () => {
    if (!account || !message || !signature) {
      setError('Please connect wallet and sign a message first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const requestBody = {
        address: account,
        message: message,
        signature: signature,
        // Example forest data
        area: 100,
        geoHash: 'test-geohash-123'
      };

      console.log('Testing POST /forests:', requestBody);

      const response = await fetch(`${API_BASE_URL}/forests/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${data.message || 'Request failed'}`);
      }

      setApiResponse(data);
      addLog('API', `POST /forests - ${response.status}`, {
        request: requestBody,
        response: data
      });

      console.log('Forests response:', data);
    } catch (err) {
      console.error('Error testing forests:', err);
      setError(err.message || 'Failed to create forest');
      addLog('ERROR', 'POST /forests failed', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Add entry to log history
  const addLog = (type, message, data = null) => {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data
    };
    setLogHistory(prev => [logEntry, ...prev].slice(0, 20)); // Keep last 20 entries
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono" style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 p-4 bg-red-900 border-2 border-red-500 rounded">
          <h1 className="text-2xl font-bold text-center">
            ⚠️ DEV / HACKATHON TEST PAGE — NOT FOR PRODUCTION ⚠️
          </h1>
          <p className="text-center mt-2 text-sm">
            Developer console for testing wallet authentication
          </p>
        </div>

        {/* MetaMask Status */}
        <div className="mb-6 p-4 bg-gray-950 rounded border border-gray-800">
          <h2 className="text-xl font-bold mb-4">MetaMask Status</h2>
          <div className="space-y-2">
            <p>
              MetaMask: {hasMetaMask ? (
                <span className="text-green-400">✓ Installed</span>
              ) : (
                <span className="text-red-400">✗ Not Found</span>
              )}
            </p>
            <p>
              Wallet: {account ? (
                <span className="text-green-400 break-all">{account}</span>
              ) : (
                <span className="text-gray-400">Not connected</span>
              )}
            </p>
            {!account && (
              <button
                onClick={connectWallet}
                disabled={!hasMetaMask || isConnecting}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>

        {/* Message Signing */}
        <div className="mb-6 p-4 bg-gray-950 rounded border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Message Signing</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Message to sign:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                rows="3"
                placeholder="Enter message to sign"
              />
            </div>
            <button
              onClick={signMessage}
              disabled={!signer || isSigning}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded"
            >
              {isSigning ? 'Signing...' : 'Sign Message'}
            </button>
            {signature && (
              <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700">
                <p className="text-sm font-bold mb-2">Signature:</p>
                <p className="text-xs break-all text-green-400">{signature}</p>
              </div>
            )}
          </div>
        </div>

        {/* Backend API Testing */}
        <div className="mb-6 p-4 bg-gray-950 rounded border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Backend API Testing</h2>
          <div className="space-y-2">
            <button
              onClick={testAuthVerify}
              disabled={!signature || isLoading}
              className="mr-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded"
            >
              {isLoading ? 'Loading...' : 'Test POST /auth/verify'}
            </button>
            <button
              onClick={testForests}
              disabled={!signature || isLoading}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded"
            >
              {isLoading ? 'Loading...' : 'Test POST /forests'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-500 rounded">
            <p className="font-bold">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* API Response */}
        {apiResponse && (
          <div className="mb-6 p-4 bg-gray-950 rounded border border-gray-800">
            <h2 className="text-xl font-bold mb-4">API Response</h2>
            <pre className="text-xs bg-black p-4 rounded border border-gray-800 overflow-auto">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Info */}
        <div className="mb-6 p-4 bg-gray-950 rounded border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Debug Info</h2>
          <div className="text-sm space-y-1">
            <p>Address: {account || 'N/A'}</p>
            <p>Message: {message || 'N/A'}</p>
            <p>Signature: {signature ? `${signature.substring(0, 20)}...` : 'N/A'}</p>
          </div>
        </div>

        {/* Log History */}
        <div className="mb-6 p-4 bg-gray-950 rounded border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Request/Response Log</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No logs yet</p>
            ) : (
              logHistory.map((log, idx) => (
                <div key={idx} className="text-xs p-2 bg-gray-900 rounded border border-gray-800">
                  <p className="font-bold">
                    [{log.timestamp}] {log.type}: {log.message}
                  </p>
                  {log.data && (
                    <pre className="mt-1 text-xs overflow-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DevConsole;

