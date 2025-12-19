//SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Governance
 * @notice DAO-style governance contract for carbon verification protocol parameters
 * @dev Simple token-weighted voting system without delegation or quadratic voting
 */
contract Governance {
    // ============ State Variables ============

    IERC20 public immutable governanceToken;
    address public oracle;

    struct ProtocolParameters {
        uint256 minNdviDelta;           // Minimum NDVI delta (scaled by 1e4)
        uint256 minConfidence;          // Minimum confidence score (scaled by 1e4)
        uint256 verificationIntervalDays; // Verification interval in days
    }

    struct Proposal {
        uint256 proposalId;              // Unique proposal identifier
        address proposer;                // Address that created the proposal
        ProtocolParameters proposedParams; // Proposed parameter values
        uint256 startBlock;              // Block when voting starts
        uint256 endBlock;                // Block when voting ends
        uint256 forVotes;                // Total FOR votes (weighted by tokens)
        uint256 againstVotes;            // Total AGAINST votes (weighted by tokens)
        bool executed;                   // Whether proposal has been executed
    }

    ProtocolParameters public parameters;

    mapping(uint256 => Proposal) public proposals;

    /// @notice Mapping of (proposalId => voter => hasVoted) to prevent double voting
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public proposalCount;

    uint256 public constant MIN_VOTING_PERIOD = 302400;


    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 minNdviDelta,
        uint256 minConfidence,
        uint256 verificationIntervalDays,
        uint256 startBlock,
        uint256 endBlock
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support, // true = FOR, false = AGAINST
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);

    event ParametersUpdated(
        uint256 minNdviDelta,
        uint256 minConfidence,
        uint256 verificationIntervalDays
    );


   constructor(
        address _governanceToken,
        address _oracle
    ) {
        require(_governanceToken != address(0), "Governance: invalid token address");
        require(_oracle != address(0), "Governance: invalid oracle address");
        oracle = _oracle;
        governanceToken = IERC20(_governanceToken);

    }

    //helper funcs to set paramss
    function setParams(uint _minNdviDelta, uint _minConfidence, uint _verificationIntervalDays) external onlyOracle {
        parameters = ProtocolParameters({
            minNdviDelta: _minNdviDelta,
            minConfidence: _minConfidence,
            verificationIntervalDays: _verificationIntervalDays
        });
        emit ParametersUpdated(_minNdviDelta, _minConfidence, _verificationIntervalDays);
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call this function");
        _;
    }
    function createProposal(
        uint256 _minNdviDelta,
        uint256 _minConfidence,
        uint256 _verificationIntervalDays,
        uint256 _votingPeriodBlocks
    ) external returns (uint256) {
        require(_votingPeriodBlocks >= MIN_VOTING_PERIOD, "Governance: voting period too short");
        
        // At least one parameter must be changed (non-zero)
        require(
            _minNdviDelta > 0 || _minConfidence > 0 || _verificationIntervalDays > 0,
            "Governance: must propose at least one parameter change"
        );

        uint256 proposalId = ++proposalCount;
        uint256 startBlock = block.number;
        uint256 endBlock = startBlock + _votingPeriodBlocks;

        // Use proposed values if non-zero, otherwise keep current values
        ProtocolParameters memory proposedParams = ProtocolParameters({
            minNdviDelta: _minNdviDelta > 0 ? _minNdviDelta : parameters.minNdviDelta,
            minConfidence: _minConfidence > 0 ? _minConfidence : parameters.minConfidence,
            verificationIntervalDays: _verificationIntervalDays > 0 
                ? _verificationIntervalDays 
                : parameters.verificationIntervalDays
        });

        proposals[proposalId] = Proposal({
            proposalId: proposalId,
            proposer: msg.sender,
            proposedParams: proposedParams,
            startBlock: startBlock,
            endBlock: endBlock,
            forVotes: 0,
            againstVotes: 0,
            executed: false
        });

        emit ProposalCreated(
            proposalId,
            msg.sender,
            proposedParams.minNdviDelta,
            proposedParams.minConfidence,
            proposedParams.verificationIntervalDays,
            startBlock,
            endBlock
        );

        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal
     * @dev Vote weight is determined by caller's token balance at voting time
     * @param _proposalId The ID of the proposal to vote on
     * @param _support true = FOR, false = AGAINST
     */
    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.proposalId != 0, "Governance: proposal does not exist");
        require(block.number >= proposal.startBlock, "Governance: voting not started");
        require(block.number <= proposal.endBlock, "Governance: voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Governance: already voted");
        require(!proposal.executed, "Governance: proposal already executed");

        // Get voter's token balance (vote weight)
        uint256 voteWeight = governanceToken.balanceOf(msg.sender);
        require(voteWeight > 0, "Governance: no tokens to vote with");

        // Mark as voted
        hasVoted[_proposalId][msg.sender] = true;

        // Add votes
        if (_support) {
            proposal.forVotes += voteWeight;
        } else {
            proposal.againstVotes += voteWeight;
        }

        emit VoteCast(_proposalId, msg.sender, _support, voteWeight);
    }

    /**
     * @notice Execute a successful proposal and update protocol parameters
     * @dev Can only be called after voting ends and if FOR votes > AGAINST votes
     * @param _proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.proposalId != 0, "Governance: proposal does not exist");
        require(block.number > proposal.endBlock, "Governance: voting not ended");
        require(!proposal.executed, "Governance: proposal already executed");
        require(proposal.forVotes > proposal.againstVotes, "Governance: proposal did not pass");

        // Mark as executed
        proposal.executed = true;

        // Update protocol parameters
        parameters = proposal.proposedParams;

        emit ProposalExecuted(_proposalId);
        emit ParametersUpdated(
            parameters.minNdviDelta,
            parameters.minConfidence,
            parameters.verificationIntervalDays
        );
    }

    // ============ View Functions ============

    /**
     * @notice Get current protocol parameters
     * @return minNdviDelta Current minimum NDVI delta
     * @return minConfidence Current minimum confidence score
     * @return verificationIntervalDays Current verification interval in days
     */
    function getParameters() external view returns (
        uint256 minNdviDelta,
        uint256 minConfidence,
        uint256 verificationIntervalDays
    ) {
        return (
            parameters.minNdviDelta,
            parameters.minConfidence,
            parameters.verificationIntervalDays
        );
    }

    /**
     * @notice Get proposal details
     * @param _proposalId The ID of the proposal
     * @return proposer Address that created the proposal
     * @return proposedParams Proposed parameter values
     * @return startBlock Block when voting starts
     * @return endBlock Block when voting ends
     * @return forVotes Total FOR votes
     * @return againstVotes Total AGAINST votes
     * @return executed Whether proposal has been executed
     */
    function getProposal(uint256 _proposalId) external view returns (
        address proposer,
        ProtocolParameters memory proposedParams,
        uint256 startBlock,
        uint256 endBlock,
        uint256 forVotes,
        uint256 againstVotes,
        bool executed
    ) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.proposalId != 0, "Governance: proposal does not exist");
        
        return (
            proposal.proposer,
            proposal.proposedParams,
            proposal.startBlock,
            proposal.endBlock,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed
        );
    }

    /**
     * @notice Check if a voter has voted on a proposal
     * @param _proposalId The ID of the proposal
     * @param _voter The address of the voter
     * @return True if the voter has already voted
     */
    function hasVoterVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        return hasVoted[_proposalId][_voter];
    }
}

