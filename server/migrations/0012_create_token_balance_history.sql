-- Migration to create token_balance_history table
-- This table tracks token balance over time for users

CREATE TABLE IF NOT EXISTS "token_balance_history" (
    "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    "userAddress" VARCHAR NOT NULL,
    "balance" NUMERIC NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "token_balance_history_userAddress_users_address_fk" 
        FOREIGN KEY ("userAddress") 
        REFERENCES "public"."users"("address") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create index on userAddress for faster queries
CREATE INDEX IF NOT EXISTS "token_balance_history_userAddress_idx" ON "token_balance_history"("userAddress");

-- Create index on timestamp for faster sorting
CREATE INDEX IF NOT EXISTS "token_balance_history_timestamp_idx" ON "token_balance_history"("timestamp");

