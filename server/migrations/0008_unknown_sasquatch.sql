CREATE TABLE "registration_sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "registration_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sessionId" integer NOT NULL,
	"organisationId" integer NOT NULL,
	"owner" varchar NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"endedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registration_sessions" ADD CONSTRAINT "registration_sessions_owner_users_address_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;