-- Drop governance tables if they exist (from previous migrations)
DROP TABLE IF EXISTS "governance_proposals" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "governance_votes" CASCADE;--> statement-breakpoint
-- Fix OrganisationMemberModel: drop malformed foreign key
ALTER TABLE "OrganisationMemberModel" DROP CONSTRAINT IF EXISTS "OrganisationMemberModel_userAddress_pastMembers_users_address_address_fk";
--> statement-breakpoint
-- Add startDate column: first as nullable, update existing rows, then make NOT NULL
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Organisation' AND column_name = 'startDate') THEN
        ALTER TABLE "Organisation" ADD COLUMN "startDate" timestamp;
        UPDATE "Organisation" SET "startDate" = "createdAt" WHERE "startDate" IS NULL;
        ALTER TABLE "Organisation" ALTER COLUMN "startDate" SET NOT NULL;
    END IF;
END $$;
--> statement-breakpoint
-- Add image column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Organisation' AND column_name = 'image') THEN
        ALTER TABLE "Organisation" ADD COLUMN "image" varchar;
    END IF;
END $$;
--> statement-breakpoint
-- Drop pastMembers column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'OrganisationMemberModel' AND column_name = 'pastMembers') THEN
        ALTER TABLE "OrganisationMemberModel" DROP COLUMN "pastMembers";
    END IF;
END $$;
--> statement-breakpoint
-- Add correct foreign key if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'OrganisationMemberModel_userAddress_users_address_fk') THEN
        ALTER TABLE "OrganisationMemberModel" ADD CONSTRAINT "OrganisationMemberModel_userAddress_users_address_fk" FOREIGN KEY ("userAddress") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;