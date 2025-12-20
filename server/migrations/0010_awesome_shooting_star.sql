ALTER TABLE "registration_sessions" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "registration_sessions" ALTER COLUMN "id" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "registration_sessions" ALTER COLUMN "sessionId" SET DATA TYPE bigint;