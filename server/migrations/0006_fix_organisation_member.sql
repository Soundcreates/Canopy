-- Drop the malformed foreign key constraint
ALTER TABLE "OrganisationMemberModel" 
DROP CONSTRAINT IF EXISTS "OrganisationMemberModel_userAddress_pastMembers_users_address_address_fk";

-- Drop the pastMembers column
ALTER TABLE "OrganisationMemberModel" 
DROP COLUMN IF EXISTS "pastMembers";

-- Add the correct foreign key for userAddress
ALTER TABLE "OrganisationMemberModel" 
ADD CONSTRAINT "OrganisationMemberModel_userAddress_users_address_fk" 
FOREIGN KEY ("userAddress") 
REFERENCES "public"."users"("address") 
ON DELETE no action 
ON UPDATE no action;

