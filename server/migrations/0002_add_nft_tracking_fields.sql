-- Add NFT tracking fields to forest table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forest' AND column_name='latestTokenId') THEN
        ALTER TABLE "forest" ADD COLUMN "latestTokenId" integer;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forest' AND column_name='latestMetadataUri') THEN
        ALTER TABLE "forest" ADD COLUMN "latestMetadataUri" varchar;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forest' AND column_name='lastVerificationDate') THEN
        ALTER TABLE "forest" ADD COLUMN "lastVerificationDate" timestamp;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forest' AND column_name='lastNDVI') THEN
        ALTER TABLE "forest" ADD COLUMN "lastNDVI" varchar;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forest' AND column_name='lastConfidence') THEN
        ALTER TABLE "forest" ADD COLUMN "lastConfidence" varchar;
    END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forest' AND column_name='totalCarbonCredits') THEN
        ALTER TABLE "forest" ADD COLUMN "totalCarbonCredits" integer DEFAULT 0;
    END IF;
END $$;

