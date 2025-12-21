import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import CTKTokenData from '../contractData/CTKToken.json';

const CTKTokenContext = createContext();

export const useCTKToken = () => {
    const context = useContext(CTKTokenContext);
    if (!context) {
        throw new Error('useCTKToken must be used within a CTKTokenProvider');
    }
    return context;
};

export const CTKTokenProvider = ({ children }) => {
    const { signer, provider, isConnected, account } = useWallet();
    const [contract, setContract] = useState(null);
    const [readOnlyContract, setReadOnlyContract] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState('0');

    // Treasury/Investment address - this should be set to your actual treasury contract or wallet
    const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000';

    // Initialize contract
    useEffect(() => {
        if (provider) {
            // Create read-only contract instance
            const readOnly = new ethers.Contract(
                CTKTokenData.address,
                CTKTokenData.abi,
                provider
            );
            setReadOnlyContract(readOnly);
        }

        if (signer) {
            // Create contract instance with signer for transactions
            const contractWithSigner = new ethers.Contract(
                CTKTokenData.address,
                CTKTokenData.abi,
                signer
            );
            setContract(contractWithSigner);
        } else {
            setContract(null);
        }
    }, [signer, provider, isConnected]);

    // Fetch balance when account changes
    useEffect(() => {
        if (readOnlyContract && account) {
            fetchBalance();
        }
    }, [readOnlyContract, account]);

    // Get token balance
    const fetchBalance = async () => {
        console.log('[CTKToken] Fetching balance...');
        console.log('[CTKToken] readOnlyContract:', readOnlyContract ? 'initialized' : 'null');
        console.log('[CTKToken] account:', account);

        try {
            if (!readOnlyContract || !account) {
                console.log('[CTKToken] Missing contract or account, returning 0');
                return '0';
            }

            console.log('[CTKToken] Calling balanceOf...');
            const bal = await readOnlyContract.balanceOf(account);
            console.log('[CTKToken] Balance (wei):', bal.toString());

            const formatted = ethers.formatEther(bal);
            console.log('[CTKToken] Balance (ether):', formatted);

            setBalance(formatted);
            return formatted;
        } catch (err) {
            console.error('[CTKToken] Error fetching balance:', err);
            setBalance('0');
            return '0';
        }
    };

    // Get token balance for specific address
    const getBalance = async (address) => {
        try {
            if (!readOnlyContract) {
                throw new Error('Contract not initialized');
            }
            const bal = await readOnlyContract.balanceOf(address);
            return ethers.formatEther(bal);
        } catch (err) {
            setError(err.message || 'Failed to get balance');
            throw err;
        }
    };

    // Transfer tokens (for investment)
    const transfer = async (to, amount) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!contract) {
                throw new Error('Wallet not connected');
            }

            // Convert amount to wei (18 decimals)
            const amountInWei = ethers.parseEther(amount.toString());

            const tx = await contract.transfer(to, amountInWei);
            const receipt = await tx.wait();

            // Refresh balance after transfer
            await fetchBalance();

            return {
                hash: receipt.hash,
                receipt
            };
        } catch (err) {
            const errorMessage = err.reason || err.message || 'Failed to transfer tokens';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Invest tokens (transfer to treasury or custom address)
    const invest = async (amount, treasuryAddress = null) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!contract) {
                throw new Error('Wallet not connected');
            }

            // Use provided treasury address or fall back to env variable
            const targetAddress = treasuryAddress || TREASURY_ADDRESS;

            if (!targetAddress || targetAddress === '0x0000000000000000000000000000000000000000') {
                throw new Error('Treasury address not provided');
            }

            // Convert amount to wei (18 decimals)
            const amountInWei = ethers.parseEther(amount.toString());

            // Check if user has enough balance
            const userBalance = await contract.balanceOf(account);
            if (userBalance < amountInWei) {
                throw new Error('Insufficient balance');
            }

            const tx = await contract.transfer(targetAddress, amountInWei);
            const receipt = await tx.wait();

            // Refresh balance after investment
            await fetchBalance();

            return {
                hash: receipt.hash,
                receipt,
                amount: amount.toString(),
                treasuryAddress: targetAddress
            };
        } catch (err) {
            const errorMessage = err.reason || err.message || 'Failed to invest tokens';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Approve tokens for spending (useful for staking contracts)
    const approve = async (spender, amount) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!contract) {
                throw new Error('Wallet not connected');
            }

            const amountInWei = ethers.parseEther(amount.toString());

            const tx = await contract.approve(spender, amountInWei);
            const receipt = await tx.wait();

            return {
                hash: receipt.hash,
                receipt
            };
        } catch (err) {
            const errorMessage = err.reason || err.message || 'Failed to approve tokens';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Get allowance
    const getAllowance = async (owner, spender) => {
        try {
            if (!readOnlyContract) {
                throw new Error('Contract not initialized');
            }
            const allowance = await readOnlyContract.allowance(owner, spender);
            return ethers.formatEther(allowance);
        } catch (err) {
            setError(err.message || 'Failed to get allowance');
            throw err;
        }
    };

    // Get token info
    const getTokenInfo = async () => {
        try {
            if (!readOnlyContract) {
                throw new Error('Contract not initialized');
            }
            const name = await readOnlyContract.name();
            const symbol = await readOnlyContract.symbol();
            const decimals = await readOnlyContract.decimals();
            const totalSupply = await readOnlyContract.totalSupply();

            return {
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply: ethers.formatEther(totalSupply)
            };
        } catch (err) {
            setError(err.message || 'Failed to get token info');
            throw err;
        }
    };

    const value = {
        contract,
        readOnlyContract,
        isLoading,
        error,
        balance,
        treasuryAddress: TREASURY_ADDRESS,
        transfer,
        invest,
        approve,
        getBalance,
        getAllowance,
        getTokenInfo,
        fetchBalance,
        contractAddress: CTKTokenData.address,
    };

    return (
        <CTKTokenContext.Provider value={value}>
            {children}
        </CTKTokenContext.Provider>
    );
};
