-- Migration: Change area column from integer to bigint
-- This fixes the issue where large area values (e.g., 3435567523) exceed PostgreSQL integer limit (2,147,483,647)

DO $$ 
BEGIN
    -- Check if column exists and is integer type before altering
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'forest' 
        AND column_name = 'area' 
        AND data_type = 'integer'
    ) THEN
        -- Alter the area column type from integer to bigint
        ALTER TABLE "forest" 
        ALTER COLUMN "area" TYPE bigint USING "area"::bigint;
        
        RAISE NOTICE 'Column area changed from integer to bigint';
    ELSE
        RAISE NOTICE 'Column area is already bigint or does not exist, skipping';
    END IF;
END $$;

-- Add a comment to document the change
COMMENT ON COLUMN "forest"."area" IS 'Forest area in square meters (bigint to support large values)';

