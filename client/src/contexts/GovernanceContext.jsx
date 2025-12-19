import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import GovernanceData from '../contractData/Governance.json';

const GovernanceContext = createContext();

export const useGovernance = () => {
  const context = useContext(GovernanceContext);
  if (!context) {
    throw new Error('useGovernance must be used within a GovernanceProvider');
  }
  return context;
};

export const GovernanceProvider = ({ children }) => {
  const { signer, provider, isConnected, account } = useWallet();
  const [contract, setContract] = useState(null);
  const [readOnlyContract, setReadOnlyContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contract
  useEffect(() => {
    if (provider) {
      // Create read-only contract instance
      const readOnly = new ethers.Contract(
        GovernanceData.address,
        GovernanceData.abi,
        provider
      );
      setReadOnlyContract(readOnly);
    }

    if (signer) {
      // Create contract instance with signer for transactions
      const contractWithSigner = new ethers.Contract(
        GovernanceData.address,
        GovernanceData.abi,
        signer
      );
      setContract(contractWithSigner);
    } else {
      setContract(null);
    }
  }, [signer, provider, isConnected]);

  // Get current protocol parameters
  const getParameters = async () => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const [minNdviDelta, minConfidence, verificationIntervalDays] = 
        await readOnlyContract.getParameters();
      return {
        minNdviDelta: Number(minNdviDelta),
        minConfidence: Number(minConfidence),
        verificationIntervalDays: Number(verificationIntervalDays)
      };
    } catch (err) {
      setError(err.message || 'Failed to get parameters');
      throw err;
    }
  };

  // Get proposal count
  const getProposalCount = async () => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const count = await readOnlyContract.proposalCount();
      return Number(count);
    } catch (err) {
      setError(err.message || 'Failed to get proposal count');
      throw err;
    }
  };

  // Get proposal details
  const getProposal = async (proposalId) => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const proposal = await readOnlyContract.getProposal(proposalId);
      const currentBlock = await provider.getBlockNumber();
      
      return {
        proposalId: Number(proposalId),
        proposer: proposal.proposer,
        proposedParams: {
          minNdviDelta: Number(proposal.proposedParams.minNdviDelta),
          minConfidence: Number(proposal.proposedParams.minConfidence),
          verificationIntervalDays: Number(proposal.proposedParams.verificationIntervalDays)
        },
        startBlock: Number(proposal.startBlock),
        endBlock: Number(proposal.endBlock),
        forVotes: Number(proposal.forVotes),
        againstVotes: Number(proposal.againstVotes),
        executed: proposal.executed,
        isActive: currentBlock >= Number(proposal.startBlock) && currentBlock <= Number(proposal.endBlock) && !proposal.executed,
        canExecute: currentBlock > Number(proposal.endBlock) && !proposal.executed && Number(proposal.forVotes) > Number(proposal.againstVotes)
      };
    } catch (err) {
      setError(err.message || 'Failed to get proposal');
      throw err;
    }
  };

  // Check if user has voted on a proposal
  const hasVoterVoted = async (proposalId) => {
    try {
      if (!readOnlyContract || !account) {
        return false;
      }
      return await readOnlyContract.hasVoterVoted(proposalId, account);
    } catch (err) {
      setError(err.message || 'Failed to check vote status');
      return false;
    }
  };

  // Get user's token balance (vote weight)
  const getVoteWeight = async () => {
    try {
      if (!readOnlyContract || !account) {
        return 0;
      }
      const tokenAddress = await readOnlyContract.governanceToken();
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const balance = await tokenContract.balanceOf(account);
      return Number(balance);
    } catch (err) {
      setError(err.message || 'Failed to get vote weight');
      return 0;
    }
  };

  // Create a new proposal
  const createProposal = async (minNdviDelta, minConfidence, verificationIntervalDays, votingPeriodBlocks) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.createProposal(
        minNdviDelta || 0,
        minConfidence || 0,
        verificationIntervalDays || 0,
        votingPeriodBlocks
      );
      await tx.wait();

      // Get proposal ID from events
      const receipt = await provider.getTransactionReceipt(tx.hash);
      let proposalId = null;
      
      try {
        const proposalCreatedEvent = receipt.logs.find(
          log => {
            try {
              const parsed = contract.interface.parseLog(log);
              return parsed && parsed.name === 'ProposalCreated';
            } catch {
              return false;
            }
          }
        );

        if (proposalCreatedEvent) {
          const parsed = contract.interface.parseLog(proposalCreatedEvent);
          proposalId = Number(parsed.args.proposalId);
        }
      } catch (err) {
        // If event parsing fails, we can still return the tx hash
        console.warn('Could not parse proposal event:', err);
      }

      return { hash: tx.hash, proposalId };
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to create proposal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Vote on a proposal
  const vote = async (proposalId, support) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.vote(proposalId, support);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to vote';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute a proposal
  const executeProposal = async (proposalId) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!contract) {
        throw new Error('Wallet not connected');
      }

      const tx = await contract.executeProposal(proposalId);
      await tx.wait();

      return tx.hash;
    } catch (err) {
      const errorMessage = err.reason || err.message || 'Failed to execute proposal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum voting period
  const getMinVotingPeriod = async () => {
    try {
      if (!readOnlyContract) {
        throw new Error('Contract not initialized');
      }
      const period = await readOnlyContract.MIN_VOTING_PERIOD();
      return Number(period);
    } catch (err) {
      setError(err.message || 'Failed to get minimum voting period');
      throw err;
    }
  };

  const value = {
    contract,
    readOnlyContract,
    isLoading,
    error,
    getParameters,
    getProposalCount,
    getProposal,
    hasVoterVoted,
    getVoteWeight,
    createProposal,
    vote,
    executeProposal,
    getMinVotingPeriod,
    contractAddress: GovernanceData.address,
  };

  return (
    <GovernanceContext.Provider value={value}>
      {children}
    </GovernanceContext.Provider>
  );
};

