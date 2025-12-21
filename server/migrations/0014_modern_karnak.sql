ALTER TABLE "Organisation" ADD COLUMN "distributionCompleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "Organisation" ADD COLUMN "distributionDate" timestamp;--> statement-breakpoint
ALTER TABLE "Organisation" ADD COLUMN "distributionTxHash" varchar;