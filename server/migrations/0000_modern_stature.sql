CREATE TABLE "forest" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "forest_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"forestId" integer NOT NULL,
	"owner" varchar NOT NULL,
	"area" integer NOT NULL,
	"geoHash" varchar NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forest_forestId_unique" UNIQUE("forestId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"address" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_address_unique" UNIQUE("address")
);
--> statement-breakpoint
ALTER TABLE "forest" ADD CONSTRAINT "forest_owner_users_address_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;