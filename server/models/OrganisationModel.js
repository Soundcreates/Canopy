const { pgTable, timestamp, varchar, boolean, integer, bigint, foreignKey } = require('drizzle-orm/pg-core');

const { UsersModel } = require('./UserModel');

const OrganisationModel = pgTable("Organisation", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar().notNull(),
    description: varchar().notNull(),
    startDate: timestamp().notNull(),
    endDate: timestamp().notNull(),
    image: varchar(), // Optional image URL or IPFS hash
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
    owner: varchar().notNull(), // Primary owner address
    isActive: boolean().notNull().default(true),
    forests: integer().array().default([]),
    addedFunds: varchar().default('0'), // Total funds invested in organization (in wei, stored as string)
}, (table) => ({
    ownerFK: foreignKey({
        columns: [table.owner],
        foreignColumns: [UsersModel.address],
    })
}))

const OrganisationMemberModel = pgTable("OrganisationMemberModel", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    organisationId: integer().notNull(),
    userAddress: varchar().notNull(),
    role: varchar().notNull(), // 'owner' or 'user'
    joinedAt: timestamp().notNull().defaultNow(),
    leftDate: timestamp().default(null),
}, (table) => ({
    orgFK: foreignKey({
        columns: [table.organisationId],
        foreignColumns: [OrganisationModel.id],
    }),
    userFK: foreignKey({
        columns: [table.userAddress],
        foreignColumns: [UsersModel.address],
    }),
}))

module.exports = { OrganisationModel, OrganisationMemberModel };