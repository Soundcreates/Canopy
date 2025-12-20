const { pgTable, varchar, numeric, timestamp, integer } = require("drizzle-orm/pg-core");
const { UsersModel } = require("./UserModel");

const TokenBalanceHistoryModel = pgTable("token_balance_history", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userAddress: varchar()
    .notNull()
    .references(() => UsersModel.address, { onDelete: "cascade" }),
  balance: numeric().notNull(), // Store as string to preserve precision
  timestamp: timestamp().notNull().defaultNow(),
});

module.exports = { TokenBalanceHistoryModel };

