const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * Run a SQL migration file
 * @param {string} migrationFile - Path to the migration SQL file
 */
async function runMigration(migrationFile) {
    console.log("Reading migration file:", migrationFile);
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');
    console.log("Migration SQL loaded");
    
    // Split by statement-breakpoint
    const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
    console.log("Number of SQL statements:", statements.length);
    
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
            console.log(`Executing statement ${i + 1}/${statements.length}`);
            console.log("SQL:", statement.substring(0, 100) + "...");
            try {
                console.log("Executing SQL statement using PostgreSQL client");
                // Use raw PostgreSQL client for executing SQL
                await pool.query(statement);
                console.log(`Statement ${i + 1} executed successfully`);
            } catch (error) {
                // If column already exists, that's okay (idempotent)
                if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate column') || error.code === '42701')) {
                    console.log(`Statement ${i + 1} skipped (column already exists)`);
                } else {
                    console.error(`Error executing statement ${i + 1}:`, error.message);
                    console.error("Error code:", error.code);
                    throw error;
                }
            }
        }
    }
    console.log("Migration completed successfully");
}

/**
 * Run all pending migrations
 */
async function runPendingMigrations() {
    console.log("Checking for pending migrations");
    const migrationsDir = path.join(__dirname, '../migrations');
    console.log("Migrations directory:", migrationsDir);
    
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    
    console.log("Found migration files:", files);
    
    // Run the latest migration (0002_add_nft_tracking_fields.sql)
    const latestMigration = path.join(migrationsDir, '0002_add_nft_tracking_fields.sql');
    console.log("Running latest migration:", latestMigration);
    
    if (fs.existsSync(latestMigration)) {
        await runMigration(latestMigration);
    } else {
        console.log("Migration file not found, skipping");
    }
}

module.exports = { runMigration, runPendingMigrations };

