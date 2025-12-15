/**
 * Standalone migration runner script
 * Run with: node scripts/runMigration.js
 */
require('dotenv').config();
const { runPendingMigrations } = require('../utils/runMigration');

async function main() {
    console.log("=== Running Database Migrations ===");
    try {
        await runPendingMigrations();
        console.log("=== Migrations Completed Successfully ===");
        process.exit(0);
    } catch (error) {
        console.error("=== Migration Failed ===");
        console.error(error);
        process.exit(1);
    }
}

main();

