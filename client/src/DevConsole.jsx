import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getApiBaseUrl } from './utils/apiConfig';

// Backend API base URL - uses environment-based configuration
const baseUrl = getApiBaseUrl();
const API_BASE_URL = `${baseUrl}/api`;

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

  // NDVI test parameters state
  const [ndviParams, setNdvParams] = useState({
    forest_id: 1,
    min_lon: -122.5,
    max_lon: -122.4,
    min_lat: 37.7,
    max_lat: 37.8,
    epoch_start: new Date().toISOString().split('T')[0],
    epoch_end: new Date().toISOString().split('T')[0],
    carbon_tons: 10.5,
    area_hectares: 5.2,
    status: 'ACTIVE'
  });

  // API request state
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nftImage, setNftImage] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

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

  // Cleanup blob URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (nftImage && nftImage.startsWith('blob:')) {
        URL.revokeObjectURL(nftImage);
      }
    };
  }, [nftImage]);

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

  // Test POST /ndvi endpoint (full pipeline)
  const testNDVI = async () => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    setNftImage(null);

    try {
      // Validate coordinates before sending
      const minLon = parseFloat(ndviParams.min_lon);
      const maxLon = parseFloat(ndviParams.max_lon);
      const minLat = parseFloat(ndviParams.min_lat);
      const maxLat = parseFloat(ndviParams.max_lat);

      // Check if coordinates are valid numbers
      if (isNaN(minLon) || isNaN(maxLon) || isNaN(minLat) || isNaN(maxLat)) {
        throw new Error('All coordinates must be valid numbers');
      }

      // Validate coordinate ranges
      if (minLon >= maxLon) {
        throw new Error(`Invalid longitude range: min_lon (${minLon}) must be less than max_lon (${maxLon})`);
      }

      if (minLat >= maxLat) {
        throw new Error(`Invalid latitude range: min_lat (${minLat}) must be less than max_lat (${maxLat})`);
      }

      // Validate coordinate bounds
      if (minLon < -180 || maxLon > 180 || minLon > 180 || maxLon < -180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      if (minLat < -90 || maxLat > 90 || minLat > 90 || maxLat < -90) {
        throw new Error('Latitude must be between -90 and 90');
      }

      // Validate area is not too small
      const lonDiff = Math.abs(maxLon - minLon);
      const latDiff = Math.abs(maxLat - minLat);
      if (lonDiff < 0.0001 || latDiff < 0.0001) {
        throw new Error(`Area too small. Minimum difference: 0.0001 degrees. Current: lon_diff=${lonDiff.toFixed(6)}, lat_diff=${latDiff.toFixed(6)}`);
      }

      // Convert forest_id to number if it's a string
      const forestId = typeof ndviParams.forest_id === 'string' 
        ? parseInt(ndviParams.forest_id) 
        : ndviParams.forest_id;

      if (isNaN(forestId) || forestId <= 0) {
        throw new Error('Forest ID must be a positive number');
      }

      const requestBody = {
        forest_id: forestId,
        min_lon: minLon,
        max_lon: maxLon,
        min_lat: minLat,
        max_lat: maxLat,
        epoch_start: ndviParams.epoch_start,
        epoch_end: ndviParams.epoch_end,
        carbon_tons: parseFloat(ndviParams.carbon_tons) || 0,
        area_hectares: parseFloat(ndviParams.area_hectares) || 0,
        status: ndviParams.status || 'ACTIVE'
      };

      console.log('Testing POST /ndvi (full pipeline):', requestBody);

      const response = await fetch(`${API_BASE_URL}/ndvi`, {
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
      addLog('API', `POST /ndvi - ${response.status}`, {
        request: requestBody,
        response: data
      });

      console.log('NDVI pipeline response:', data);
      
      // Fetch the NFT image if imageUri is available
      if (data.data && data.data.imageUri) {
        console.log('Fetching NFT image from IPFS:', data.data.imageUri);
        await fetchNFTImage(data.data.imageUri);
      }
    } catch (err) {
      console.error('Error testing NDVI pipeline:', err);
      setError(err.message || 'Failed to compute NDVI');
      addLog('ERROR', 'POST /ndvi failed', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch NFT image from IPFS
  const fetchNFTImage = async (imageUri) => {
    setIsLoadingImage(true);
    setNftImage(null);
    
    try {
      console.log('Fetching image from IPFS:', imageUri);
      
      // Extract hash from ipfs:// URI if needed
      let ipfsHash = imageUri;
      if (imageUri.startsWith('ipfs://')) {
        ipfsHash = imageUri.replace('ipfs://', '');
      }
      
      console.log('Using IPFS hash:', ipfsHash);
      
      // Fetch image from backend endpoint
      const response = await fetch(`${API_BASE_URL}/ndvi/image?ipfsHash=${encodeURIComponent(ipfsHash)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      // Convert response to blob URL for display
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      console.log('Image fetched successfully');
      setNftImage(imageUrl);
      addLog('IMAGE', 'NFT image fetched from IPFS', { imageUri, ipfsHash });
    } catch (err) {
      console.error('Error fetching NFT image:', err);
      setError(`Failed to fetch NFT image: ${err.message}`);
      addLog('ERROR', 'Failed to fetch NFT image', { error: err.message });
    } finally {
      setIsLoadingImage(false);
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
            Testin page
          </h1>
          <p className="text-center mt-2 text-sm">
            just to test sm funcs in backend
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
              className="mr-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded"
            >
              {isLoading ? 'Loading...' : 'Test POST /forests'}
            </button>
            <button
              onClick={testNDVI}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed rounded"
            >
              {isLoading ? 'Processing...' : 'Test POST /ndvi (Full Pipeline)'}
            </button>
          </div>
        </div>

        {/* NDVI Test Parameters */}
        <div className="mb-6 p-4 bg-gray-950 rounded border border-gray-800">
          <h2 className="text-xl font-bold mb-4">NDVI Pipeline Test Parameters</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm">Forest ID:</label>
              <input
                type="number"
                value={ndviParams.forest_id}
                onChange={(e) => setNdvParams({...ndviParams, forest_id: parseInt(e.target.value) || 0})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Status:</label>
              <select
                value={ndviParams.status}
                onChange={(e) => setNdvParams({...ndviParams, status: e.target.value})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DEGRADED">DEGRADED</option>
                <option value="REVOKED">REVOKED</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm">Min Longitude:</label>
              <input
                type="number"
                step="0.0001"
                value={ndviParams.min_lon}
                onChange={(e) => setNdvParams({...ndviParams, min_lon: parseFloat(e.target.value) || 0})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                placeholder="-122.5"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Max Longitude:</label>
              <input
                type="number"
                step="0.0001"
                value={ndviParams.max_lon}
                onChange={(e) => setNdvParams({...ndviParams, max_lon: parseFloat(e.target.value) || 0})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                placeholder="-122.4"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Min Latitude:</label>
              <input
                type="number"
                step="0.0001"
                value={ndviParams.min_lat}
                onChange={(e) => setNdvParams({...ndviParams, min_lat: parseFloat(e.target.value) || 0})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                placeholder="37.7"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Max Latitude:</label>
              <input
                type="number"
                step="0.0001"
                value={ndviParams.max_lat}
                onChange={(e) => setNdvParams({...ndviParams, max_lat: parseFloat(e.target.value) || 0})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                placeholder="37.8"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Epoch Start:</label>
              <input
                type="date"
                value={ndviParams.epoch_start}
                onChange={(e) => setNdvParams({...ndviParams, epoch_start: e.target.value})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Epoch End:</label>
              <input
                type="date"
                value={ndviParams.epoch_end}
                onChange={(e) => setNdvParams({...ndviParams, epoch_end: e.target.value})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Carbon Tons:</label>
              <input
                type="number"
                step="0.1"
                value={ndviParams.carbon_tons}
                onChange={(e) => setNdvParams({...ndviParams, carbon_tons: parseFloat(e.target.value) || 0})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                placeholder="10.5"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Area Hectares:</label>
              <input
                type="number"
                step="0.1"
                value={ndviParams.area_hectares}
                onChange={(e) => setNdvParams({...ndviParams, area_hectares: parseFloat(e.target.value) || 0})}
                className="w-full p-2 bg-gray-900 text-white rounded border border-gray-700"
                placeholder="5.2"
              />
            </div>
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

        {/* NFT Image Display */}
        {(nftImage || isLoadingImage) && (
          <div className="mb-6 p-4 bg-gray-950 rounded border border-gray-800">
            <h2 className="text-xl font-bold mb-4">NFT Image</h2>
            {isLoadingImage ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-gray-400">Loading image from IPFS...</p>
              </div>
            ) : nftImage ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={nftImage} 
                    alt="NFT Image" 
                    className="max-w-full h-auto rounded border border-gray-700 shadow-lg"
                    style={{ maxHeight: '600px' }}
                  />
                </div>
                {apiResponse?.data?.imageUri && (
                  <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700">
                    <p className="text-sm font-bold mb-2">Image URI:</p>
                    <p className="text-xs break-all text-green-400">{apiResponse.data.imageUri}</p>
                  </div>
                )}
              </div>
            ) : null}
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

