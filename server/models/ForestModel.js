const { pgTable, timestamp, varchar, boolean, integer, foreignKey } = require('drizzle-orm/pg-core');
const { UsersModel } = require('./UserModel');

const ForestModel = pgTable("forest", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    forestId: integer().notNull().unique(),
    owner: varchar().notNull(),
    area: integer().notNull(),
    geoHash: varchar().notNull(),
    txHash: varchar().notNull().unique(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
}, (table) => ({
    ownerFk: foreignKey({
        columns: [table.owner],
        foreignColumns: [UsersModel.address],
    }),
}));

module.exports = { ForestModel };