CREATE TABLE "token_balance_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "token_balance_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userAddress" varchar NOT NULL,
	"balance" numeric NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Organisation" ADD COLUMN "forests" integer[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "registration_sessions" ADD COLUMN "users" varchar[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_balance_history" ADD CONSTRAINT "token_balance_history_userAddress_users_address_fk" FOREIGN KEY ("userAddress") REFERENCES "public"."users"("address") ON DELETE cascade ON UPDATE no action;