const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");

// Create pool for raw SQL execution
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Create and export the database connection
// This avoids circular dependencies by having a dedicated config file
const db = drizzle(process.env.DATABASE_URL);

console.log("Database connection initialized");

module.exports = { db, pool };

