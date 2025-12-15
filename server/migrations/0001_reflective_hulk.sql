ALTER TABLE "forest" ADD COLUMN "txHash" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "forest" ADD CONSTRAINT "forest_txHash_unique" UNIQUE("txHash");