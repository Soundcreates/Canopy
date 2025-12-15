const { drizzle } = require("drizzle-orm/node-postgres");

// Create and export the database connection
// This avoids circular dependencies by having a dedicated config file
const db = drizzle(process.env.DATABASE_URL);

console.log("Database connection initialized");

module.exports = { db };

