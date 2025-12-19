CREATE TABLE "Organisation" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "Organisation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar NOT NULL,
	"description" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"endDate" timestamp NOT NULL,
	"owner" varchar NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OrganisationMemberModel" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "OrganisationMemberModel_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organisationId" integer NOT NULL,
	"userAddress" varchar NOT NULL,
	"role" varchar NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"pastMembers" varchar DEFAULT '' NOT NULL,
	"leftDate" timestamp DEFAULT null
);
--> statement-breakpoint
DROP TABLE "governance_proposals" CASCADE;--> statement-breakpoint
DROP TABLE "governance_votes" CASCADE;--> statement-breakpoint
ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_owner_users_address_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrganisationMemberModel" ADD CONSTRAINT "OrganisationMemberModel_organisationId_Organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."Organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OrganisationMemberModel" ADD CONSTRAINT "OrganisationMemberModel_userAddress_pastMembers_users_address_address_fk" FOREIGN KEY ("userAddress","pastMembers") REFERENCES "public"."users"("address","address") ON DELETE no action ON UPDATE no action;