-- Migration to add CASCADE delete behavior to foreign keys referencing users table
-- This allows deletion of users and automatically deletes/updates dependent records

-- Drop existing foreign key constraints
ALTER TABLE "Organisation" DROP CONSTRAINT IF EXISTS "Organisation_owner_users_address_fk";
ALTER TABLE "OrganisationMemberModel" DROP CONSTRAINT IF EXISTS "OrganisationMemberModel_userAddress_users_address_fk";
ALTER TABLE "forest" DROP CONSTRAINT IF EXISTS "forest_owner_users_address_fk";
ALTER TABLE "registration_sessions" DROP CONSTRAINT IF EXISTS "registration_sessions_owner_users_address_fk";
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_inviterAddress_users_address_fk";
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_inviteeAddress_users_address_fk";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_userAddress_users_address_fk";

-- Recreate foreign keys with CASCADE delete
-- When a user is deleted, their organisations will also be deleted
ALTER TABLE "Organisation" 
ADD CONSTRAINT "Organisation_owner_users_address_fk" 
FOREIGN KEY ("owner") 
REFERENCES "public"."users"("address") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- When a user is deleted, their organisation memberships will be deleted
ALTER TABLE "OrganisationMemberModel" 
ADD CONSTRAINT "OrganisationMemberModel_userAddress_users_address_fk" 
FOREIGN KEY ("userAddress") 
REFERENCES "public"."users"("address") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- When a user is deleted, their forests will be deleted
ALTER TABLE "forest" 
ADD CONSTRAINT "forest_owner_users_address_fk" 
FOREIGN KEY ("owner") 
REFERENCES "public"."users"("address") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- When a user is deleted, their registration sessions will be deleted
ALTER TABLE "registration_sessions" 
ADD CONSTRAINT "registration_sessions_owner_users_address_fk" 
FOREIGN KEY ("owner") 
REFERENCES "public"."users"("address") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- When a user is deleted, invitations they sent will be deleted
ALTER TABLE "invitations" 
ADD CONSTRAINT "invitations_inviterAddress_users_address_fk" 
FOREIGN KEY ("inviterAddress") 
REFERENCES "public"."users"("address") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- When a user is deleted, invitations sent to them will be deleted
ALTER TABLE "invitations" 
ADD CONSTRAINT "invitations_inviteeAddress_users_address_fk" 
FOREIGN KEY ("inviteeAddress") 
REFERENCES "public"."users"("address") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- When a user is deleted, their notifications will be deleted
ALTER TABLE "notifications" 
ADD CONSTRAINT "notifications_userAddress_users_address_fk" 
FOREIGN KEY ("userAddress") 
REFERENCES "public"."users"("address") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

