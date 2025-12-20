const { pgTable, timestamp, varchar, boolean, integer, bigint, foreignKey } = require('drizzle-orm/pg-core');
const { UsersModel } = require('./UserModel');

const ForestModel = pgTable("forest", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    forestId: integer().notNull().unique(),
    owner: varchar().notNull(),
    area: bigint({ mode: 'number' }).notNull(),
    geoHash: varchar().notNull(),
    txHash: varchar().notNull().unique(),
    isActive: boolean().notNull().default(true),
    organisationId: integer().default(null),
    // NFT tracking fields
    latestTokenId: integer(), // Latest carbon credit NFT token ID
    latestMetadataUri: varchar(), // Latest NFT metadata URI
    lastVerificationDate: timestamp(), // Last NDVI verification date
    lastNDVI: varchar(), // Last computed NDVI value
    lastConfidence: varchar(), // Last confidence score
    totalCarbonCredits: integer().default(0), // Total carbon credits minted
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
}, (table) => ({
    ownerFk: foreignKey({
        columns: [table.owner],
        foreignColumns: [UsersModel.address],
    }),
}));

module.exports = { ForestModel };