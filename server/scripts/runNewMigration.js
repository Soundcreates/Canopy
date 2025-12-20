const { runMigration } = require('../utils/runMigration');
const path = require('path');

async function main() {
    try {
        const migrationFile = path.join(__dirname, '../migrations/0009_legal_randall_flagg.sql');
        console.log('Running migration:', migrationFile);
        await runMigration(migrationFile);
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main();

