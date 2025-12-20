CREATE TABLE "invitations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invitations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organisationId" integer NOT NULL,
	"inviterAddress" varchar NOT NULL,
	"inviteeAddress" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"role" varchar DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"respondedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"userAddress" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" varchar NOT NULL,
	"relatedEntityId" integer,
	"relatedEntityType" varchar,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviterAddress_users_address_fk" FOREIGN KEY ("inviterAddress") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviteeAddress_users_address_fk" FOREIGN KEY ("inviteeAddress") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organisationId_Organisation_id_fk" FOREIGN KEY ("organisationId") REFERENCES "public"."Organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userAddress_users_address_fk" FOREIGN KEY ("userAddress") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_organisation_id_idx" ON "invitations" USING btree ("organisationId");--> statement-breakpoint
CREATE INDEX "invitations_invitee_address_idx" ON "invitations" USING btree ("inviteeAddress");--> statement-breakpoint
CREATE INDEX "invitations_status_idx" ON "invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invitations_org_invitee_idx" ON "invitations" USING btree ("organisationId","inviteeAddress");--> statement-breakpoint
CREATE INDEX "notifications_user_address_idx" ON "notifications" USING btree ("userAddress");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");