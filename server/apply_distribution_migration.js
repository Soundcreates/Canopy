const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function applyDistributionMigration() {
    try {
        console.log('Adding distribution fields to Organisation table...');

        await pool.query(`
            ALTER TABLE "Organisation" 
            ADD COLUMN IF NOT EXISTS "distributionCompleted" boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS "distributionDate" timestamp,
            ADD COLUMN IF NOT EXISTS "distributionTxHash" varchar;
        `);

        console.log('✅ Successfully added distribution fields!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding fields:', error);
        process.exit(1);
    }
}

applyDistributionMigration();
