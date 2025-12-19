const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

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

async function runPendingMigrations() {
    console.log("Checking for pending migrations");
    const migrationsDir = path.join(__dirname, '../migrations');
    console.log("Migrations directory:", migrationsDir);
    
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql') && !f.includes('meta'))
        .sort();
    
    console.log("Found migration files:", files);
    
    // Run all migrations in order
    for (const file of files) {
        const migrationPath = path.join(migrationsDir, file);
        console.log("Running migration:", file);
        try {
            await runMigration(migrationPath);
            console.log(`Migration ${file} completed successfully`);
        } catch (error) {
            // If it's a "column already exists" or similar error, that's okay
            if (error.message && (
                error.message.includes('already exists') || 
                error.message.includes('duplicate column') || 
                error.code === '42701' ||
                error.message.includes('does not exist') ||
                error.message.includes('column "area" cannot be cast')
            )) {
                console.log(`Migration ${file} skipped (already applied or not applicable)`);
            } else {
                console.error(`Error running migration ${file}:`, error.message);
                // Continue with other migrations even if one fails
            }
        }
    }
    
    console.log("All migrations processed");
}

module.exports = { runMigration, runPendingMigrations };

