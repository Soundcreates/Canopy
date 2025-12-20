const { db } = require('./config/db');
const { sql } = require('drizzle-orm');

async function applyMigration() {
    try {
        console.log('Applying organisationId column migration...');
        await db.execute(sql`ALTER TABLE forest ADD COLUMN IF NOT EXISTS "organisationId" integer DEFAULT null`);
        console.log('Migration applied successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error applying migration:', error);
        process.exit(1);
    }
}

applyMigration();
