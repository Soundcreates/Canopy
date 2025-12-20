const { pgTable, varchar, timestamp, boolean, integer, index, foreignKey } = require('drizzle-orm/pg-core');
const { UsersModel } = require('./UserModel');

const NotificationModel = pgTable('notifications', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().notNull(), // Reference to users.id
    userAddress: varchar().notNull(), // Also store address for quick lookup
    type: varchar().notNull(), // 'invitation', 'system', etc.
    title: varchar().notNull(),
    message: varchar().notNull(),
    relatedEntityId: integer(), // ID of related entity (e.g., invitation ID, organisation ID)
    relatedEntityType: varchar(), // Type of related entity (e.g., 'invitation', 'organisation')
    read: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
}, (table) => ({
    userAddressIdx: index('notifications_user_address_idx').on(table.userAddress),
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    readIdx: index('notifications_read_idx').on(table.read),
    typeIdx: index('notifications_type_idx').on(table.type),
    userFk: foreignKey({
        columns: [table.userAddress],
        foreignColumns: [UsersModel.address],
    }),
}));

module.exports = { NotificationModel };

