const { pgTable, varchar, timestamp, boolean, bigint, integer, index } = require("drizzle-orm/pg-core");

const GovernanceProposalModel = pgTable('governance_proposals', {
    proposalId: bigint({ mode: 'number' }).primaryKey(),
    proposer: varchar().notNull(),
    minNdviDelta: bigint({ mode: 'number' }).notNull(),
    minConfidence: bigint({ mode: 'number' }).notNull(),
    verificationIntervalDays: bigint({ mode: 'number' }).notNull(),
    startBlock: bigint({ mode: 'number' }).notNull(),
    endBlock: bigint({ mode: 'number' }).notNull(),
    executed: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
}, (table) => ({
    proposerIdx: index('governance_proposals_proposer_idx').on(table.proposer),
    executedIdx: index('governance_proposals_executed_idx').on(table.executed),
    endBlockIdx: index('governance_proposals_end_block_idx').on(table.endBlock),
}));

const GovernanceVoteModel = pgTable('governance_votes', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    proposalId: bigint({ mode: 'number' }).notNull(),
    voter: varchar().notNull(),
    support: boolean().notNull(),
    votingPower: bigint({ mode: 'number' }).notNull(),
    votedAt: timestamp().notNull().defaultNow(),
}, (table) => ({
    proposalIdIdx: index('governance_votes_proposal_id_idx').on(table.proposalId),
    voterIdx: index('governance_votes_voter_idx').on(table.voter),
    proposalVoterIdx: index('governance_votes_proposal_voter_idx').on(table.proposalId, table.voter),
}));

module.exports = { GovernanceProposalModel, GovernanceVoteModel };

