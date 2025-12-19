CREATE TABLE "governance_proposals" (
	"proposalId" bigint PRIMARY KEY NOT NULL,
	"proposer" varchar NOT NULL,
	"minNdviDelta" bigint NOT NULL,
	"minConfidence" bigint NOT NULL,
	"verificationIntervalDays" bigint NOT NULL,
	"startBlock" bigint NOT NULL,
	"endBlock" bigint NOT NULL,
	"executed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_votes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "governance_votes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"proposalId" bigint NOT NULL,
	"voter" varchar NOT NULL,
	"support" boolean NOT NULL,
	"votingPower" bigint NOT NULL,
	"votedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "governance_proposals_proposer_idx" ON "governance_proposals" USING btree ("proposer");--> statement-breakpoint
CREATE INDEX "governance_proposals_executed_idx" ON "governance_proposals" USING btree ("executed");--> statement-breakpoint
CREATE INDEX "governance_proposals_end_block_idx" ON "governance_proposals" USING btree ("endBlock");--> statement-breakpoint
CREATE INDEX "governance_votes_proposal_id_idx" ON "governance_votes" USING btree ("proposalId");--> statement-breakpoint
CREATE INDEX "governance_votes_voter_idx" ON "governance_votes" USING btree ("voter");--> statement-breakpoint
CREATE INDEX "governance_votes_proposal_voter_idx" ON "governance_votes" USING btree ("proposalId","voter");