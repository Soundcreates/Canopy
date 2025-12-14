import { pgTable, timestamp, varchar, boolean, integer, foreignKey } from 'drizzle-orm/pg-core';
import { UsersModel } from './UserModel';

export const ForestModel = pgTable("forest", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    forestId: integer().notNull().unique(),
    owner: varchar().notNull(),
    area: integer().notNull(),
    geoHash: varchar().notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
}, (table) => ({
    ownerFk: foreignKey({
        columns: [table.owner],
        foreignColumns: [UsersModel.address],
    }),
}));