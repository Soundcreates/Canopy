import {pgTable, varchar, timestamp, integer} from "drizzle-orm/pg-core"

export const UsersModel = pgTable('users' ,{
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    address: varchar().notNull().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
})