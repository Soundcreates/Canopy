ALTER TABLE "forest" ADD COLUMN "latestTokenId" integer;--> statement-breakpoint
ALTER TABLE "forest" ADD COLUMN "latestMetadataUri" varchar;--> statement-breakpoint
ALTER TABLE "forest" ADD COLUMN "lastVerificationDate" timestamp;--> statement-breakpoint
ALTER TABLE "forest" ADD COLUMN "lastNDVI" varchar;--> statement-breakpoint
ALTER TABLE "forest" ADD COLUMN "lastConfidence" varchar;--> statement-breakpoint
ALTER TABLE "forest" ADD COLUMN "totalCarbonCredits" integer DEFAULT 0;