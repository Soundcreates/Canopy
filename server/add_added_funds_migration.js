const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function addAddedFundsColumn() {
    try {
        console.log('Adding addedFunds column to Organisation table...');

        await pool.query(`
            ALTER TABLE "Organisation" 
            ADD COLUMN IF NOT EXISTS "addedFunds" varchar DEFAULT '0';
        `);

        console.log('✅ Successfully added addedFunds column!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding column:', error);
        process.exit(1);
    }
}

addAddedFundsColumn();
