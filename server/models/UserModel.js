const {pgTable, varchar, timestamp, integer} = require("drizzle-orm/pg-core");

const UsersModel = pgTable('users' ,{
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    address: varchar().notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
});

module.exports = { UsersModel };