const {
  pgTable,
integer,
bigint  ,
  timestamp,
  boolean,
  varchar,
  foreignKey,
} = require("drizzle-orm/pg-core");
const { UsersModel } = require("./UserModel");

const RegistrationsSessionsModel = pgTable(
  "registration_sessions",
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    sessionId: bigint({ mode: 'number' }).notNull(),
    organisationId: integer().notNull(),
    owner: varchar().notNull(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    endedAt: timestamp().notNull(),
  },
  (table) => ({
    ownerFK: foreignKey({
      columns: [table.owner],
      foreignColumns: [UsersModel.address],
    }),
  }),
);

module.exports = { RegistrationsSessionsModel };
