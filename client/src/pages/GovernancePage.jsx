import { useState, useEffect } from 'react';
import { useGovernance } from '../contexts/GovernanceContext';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

const GovernancePage = () => {
  const { 
    getParameters, 
    getProposalCount, 
    getProposal, 
    hasVoterVoted,
    getVoteWeight,
    createProposal, 
    vote, 
    executeProposal,
    getMinVotingPeriod,
    isLoading,
    error,
    readOnlyContract,
    provider
  } = useGovernance();
  
  const { isConnected, account } = useWallet();
  
  const [parameters, setParameters] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [voteWeights, setVoteWeights] = useState({});
  const [hasVotedMap, setHasVotedMap] = useState({});
  const [minVotingPeriod, setMinVotingPeriod] = useState(null);
  const [currentBlock, setCurrentBlock] = useState(null);
  
  // Form state for creating proposals
  const [formData, setFormData] = useState({
    minNdviDelta: '',
    minConfidence: '',
    verificationIntervalDays: '',
    votingPeriodDays: ''
  });
  const [formError, setFormError] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isConnected, account]);

  const loadData = async () => {
    try {
      // Get current block
      if (provider) {
        const block = await provider.getBlockNumber();
        setCurrentBlock(block);
      }

      // Load parameters
      const params = await getParameters();
      setParameters(params);

      // Load minimum voting period
      const minPeriod = await getMinVotingPeriod();
      setMinVotingPeriod(minPeriod);

      // Load proposals
      const count = await getProposalCount();
      const proposalPromises = [];
      for (let i = 1; i <= count; i++) {
        proposalPromises.push(getProposal(i));
      }
      const allProposals = await Promise.all(proposalPromises);
      setProposals(allProposals);

      // Load vote weights and voting status for connected user
      if (isConnected && account) {
        const weight = await getVoteWeight();
        setVoteWeights({ [account]: weight });

        const votedPromises = allProposals.map(p => hasVoterVoted(p.proposalId));
        const votedResults = await Promise.all(votedPromises);
        const votedMap = {};
        allProposals.forEach((p, idx) => {
          votedMap[p.proposalId] = votedResults[idx];
        });
        setHasVotedMap(votedMap);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleVote = async (proposalId, support) => {
    try {
      setFormError('');
      await vote(proposalId, support);
      await loadData(); // Refresh data
    } catch (err) {
      setFormError(err.message || 'Failed to vote');
    }
  };

  const handleExecute = async (proposalId) => {
    try {
      setFormError('');
      await executeProposal(proposalId);
      await loadData(); // Refresh data
    } catch (err) {
      setFormError(err.message || 'Failed to execute proposal');
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate that at least one parameter is provided
    if (!formData.minNdviDelta && !formData.minConfidence && !formData.verificationIntervalDays) {
      setFormError('At least one parameter must be changed');
      return;
    }

    // Validate voting period
    if (!formData.votingPeriodDays) {
      setFormError('Voting period is required');
      return;
    }

    try {
      // Convert days to blocks (assuming ~2 seconds per block, ~43200 blocks per day)
      const blocksPerDay = 43200;
      const votingPeriodBlocks = Math.floor(parseFloat(formData.votingPeriodDays) * blocksPerDay);
      
      if (votingPeriodBlocks < minVotingPeriod) {
        setFormError(`Voting period must be at least ${Math.ceil(minVotingPeriod / blocksPerDay)} days`);
        return;
      }

      // Scale values by 1e4 as per contract
      const minNdviDelta = formData.minNdviDelta ? Math.floor(parseFloat(formData.minNdviDelta) * 10000) : 0;
      const minConfidence = formData.minConfidence ? Math.floor(parseFloat(formData.minConfidence) * 10000) : 0;
      const verificationIntervalDays = formData.verificationIntervalDays ? Math.floor(parseFloat(formData.verificationIntervalDays)) : 0;

      await createProposal(minNdviDelta, minConfidence, verificationIntervalDays, votingPeriodBlocks);
      
      // Reset form
      setFormData({
        minNdviDelta: '',
        minConfidence: '',
        verificationIntervalDays: '',
        votingPeriodDays: ''
      });
      
      await loadData(); // Refresh data
    } catch (err) {
      setFormError(err.message || 'Failed to create proposal');
    }
  };

  const formatValue = (value, scale = 10000) => {
    return (value / scale).toFixed(4);
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getBlockTimeEstimate = (blocks) => {
    // Assuming ~2 seconds per block
    const seconds = blocks * 2;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  const activeProposals = proposals.filter(p => p.isActive);
  const executableProposals = proposals.filter(p => p.canExecute);

  return (
    <div className="min-h-screen w-full bg-[#0b0f14] text-gray-300 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-white/90 mb-2">DAO Governance</h1>
          <p className="text-gray-400 text-sm">Manage protocol verification parameters through decentralized governance</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {formError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {formError}
          </div>
        )}

        {/* Current Protocol Parameters */}
        <section className="mb-12">
          <h2 className="text-xl font-medium text-white/90 mb-4">Current Protocol Parameters</h2>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            {parameters ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Minimum NDVI Delta</div>
                  <div className="text-lg font-mono text-white">{formatValue(parameters.minNdviDelta)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Minimum Confidence</div>
                  <div className="text-lg font-mono text-white">{formatValue(parameters.minConfidence)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Verification Interval</div>
                  <div className="text-lg font-mono text-white">{parameters.verificationIntervalDays} days</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Loading parameters...</div>
            )}
          </div>
        </section>

        {/* Active Proposals */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-white/90">Active Proposals</h2>
            {currentBlock && (
              <div className="text-xs text-gray-400 font-mono">Block: {currentBlock.toLocaleString()}</div>
            )}
          </div>
          
          {activeProposals.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
              No active proposals
            </div>
          ) : (
            <div className="space-y-4">
              {activeProposals.map((proposal) => {
                const blocksRemaining = proposal.endBlock - currentBlock;
                const hasVoted = hasVotedMap[proposal.proposalId] || false;
                const voteWeight = voteWeights[account] || 0;
                
                return (
                  <div key={proposal.proposalId} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">Proposal #{proposal.proposalId}</div>
                        <div className="text-xs text-gray-400">Proposed by {formatAddress(proposal.proposer)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 mb-1">Voting Window</div>
                        <div className="text-xs font-mono text-white">
                          Blocks {proposal.startBlock.toLocaleString()} - {proposal.endBlock.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {blocksRemaining > 0 ? `${getBlockTimeEstimate(blocksRemaining)} remaining` : 'Ended'}
                        </div>
                      </div>
                    </div>

                    {/* Proposed Changes */}
                    <div className="mb-4 p-4 bg-gray-800/30 rounded border border-gray-700/50">
                      <div className="text-xs text-gray-400 mb-2">Proposed Parameter Changes</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Min NDVI Delta</div>
                          <div className="text-sm font-mono text-white">
                            {formatValue(proposal.proposedParams.minNdviDelta)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Min Confidence</div>
                          <div className="text-sm font-mono text-white">
                            {formatValue(proposal.proposedParams.minConfidence)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Verification Interval</div>
                          <div className="text-sm font-mono text-white">
                            {proposal.proposedParams.verificationIntervalDays} days
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Voting Results */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs text-gray-400">Voting Results</div>
                        <div className="text-xs text-gray-500">
                          Total: {(proposal.forVotes + proposal.againstVotes).toLocaleString()} votes
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded">
                          <div className="text-xs text-emerald-400 mb-1">FOR</div>
                          <div className="text-sm font-mono text-white">{proposal.forVotes.toLocaleString()}</div>
                        </div>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                          <div className="text-xs text-red-400 mb-1">AGAINST</div>
                          <div className="text-sm font-mono text-white">{proposal.againstVotes.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Vote Buttons */}
                    {isConnected && !hasVoted && voteWeight > 0 && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVote(proposal.proposalId, true)}
                          disabled={isLoading}
                          className="flex-1 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-sm font-medium rounded border border-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Vote FOR
                        </button>
                        <button
                          onClick={() => handleVote(proposal.proposalId, false)}
                          disabled={isLoading}
                          className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium rounded border border-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Vote AGAINST
                        </button>
                      </div>
                    )}

                    {isConnected && hasVoted && (
                      <div className="text-xs text-gray-500 italic">You have already voted on this proposal</div>
                    )}

                    {isConnected && voteWeight === 0 && (
                      <div className="text-xs text-gray-500 italic">No governance tokens to vote with</div>
                    )}

                    {!isConnected && (
                      <div className="text-xs text-gray-500 italic">Connect wallet to vote</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Executable Proposals */}
        {executableProposals.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-medium text-white/90 mb-4">Executable Proposals</h2>
            <div className="space-y-4">
              {executableProposals.map((proposal) => (
                <div key={proposal.proposalId} className="bg-gray-900/50 border border-yellow-500/30 rounded-lg p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-white mb-1">Proposal #{proposal.proposalId}</div>
                      <div className="text-xs text-gray-400">Ready to execute</div>
                    </div>
                    <button
                      onClick={() => handleExecute(proposal.proposalId)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-sm font-medium rounded border border-yellow-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Execute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Create Proposal */}
        <section>
          <h2 className="text-xl font-medium text-white/90 mb-4">Create Proposal</h2>
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            {!isConnected ? (
              <div className="text-center text-gray-500 py-8">
                Connect your wallet to create a proposal
              </div>
            ) : (
              <>
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  <div className="text-xs text-yellow-400 font-medium mb-1">⚠️ Protocol-Wide Impact</div>
                  <div className="text-xs text-gray-400">
                    Changes to these parameters will affect all verification processes across the protocol. 
                    Ensure proposed values are carefully considered.
                  </div>
                </div>

                <form onSubmit={handleCreateProposal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Minimum NDVI Delta (leave empty to keep current)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.minNdviDelta}
                        onChange={(e) => setFormData({ ...formData, minNdviDelta: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                        placeholder="Current value"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Minimum Confidence (leave empty to keep current)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.minConfidence}
                        onChange={(e) => setFormData({ ...formData, minConfidence: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                        placeholder="Current value"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Verification Interval (days, leave empty to keep current)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={formData.verificationIntervalDays}
                        onChange={(e) => setFormData({ ...formData, verificationIntervalDays: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                        placeholder="Current value"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Voting Period (days) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        min={minVotingPeriod ? Math.ceil(minVotingPeriod / 43200) : 7}
                        value={formData.votingPeriodDays}
                        onChange={(e) => setFormData({ ...formData, votingPeriodDays: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                        placeholder={minVotingPeriod ? `Min: ${Math.ceil(minVotingPeriod / 43200)} days` : '7 days'}
                        required
                      />
                      {minVotingPeriod && (
                        <div className="text-xs text-gray-500 mt-1">
                          Minimum: {Math.ceil(minVotingPeriod / 43200)} days
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-sm font-medium rounded border border-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Proposal...' : 'Create Proposal'}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GovernancePage;





