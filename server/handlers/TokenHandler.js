const { db } = require("../config/db");
const { eq, desc } = require("drizzle-orm");
const { TokenBalanceHistoryModel } = require("../models/TokenBalanceHistoryModel");
const { UsersModel } = require("../models/UserModel");
const { tokenService } = require("../utils/tokenService");

/**
 * Get current token balance for a user
 */
async function getBalance(req, res) {
  try {
    const { address } = req.query;

    if (!address || address === "null" || address === "undefined") {
      return res.status(400).json({
        error: "Address parameter is required",
        message: "Please provide a valid wallet address"
      });
    }

    const normalizedAddress = address.toLowerCase();

    // Get balance from token contract
    const balance = await tokenService.getBalance(normalizedAddress);

    // Record balance in history (async, don't block response)
    recordBalanceHistory(normalizedAddress, balance).catch(err => {
      console.error("Error recording balance history (non-blocking):", err);
    });

    return res.status(200).json({
      success: true,
      balance: balance,
      address: normalizedAddress
    });
  } catch (error) {
    console.error("Error getting token balance:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
}

/**
 * Get token balance history for a user
 */
async function getBalanceHistory(req, res) {
  try {
    const { address } = req.query;

    if (!address || address === "null" || address === "undefined") {
      return res.status(400).json({
        error: "Address parameter is required",
        message: "Please provide a valid wallet address"
      });
    }

    const normalizedAddress = address.toLowerCase();

    // Get history from database
    const history = await db
      .select()
      .from(TokenBalanceHistoryModel)
      .where(eq(TokenBalanceHistoryModel.userAddress, normalizedAddress))
      .orderBy(desc(TokenBalanceHistoryModel.timestamp))
      .limit(100); // Limit to last 100 records

    // Format for chart (oldest to newest)
    const chartData = history
      .reverse()
      .map((record, index) => ({
        name: formatDate(record.timestamp),
        credits: parseFloat(record.balance),
        timestamp: record.timestamp
      }));

    return res.status(200).json({
      success: true,
      history: chartData,
      address: normalizedAddress
    });
  } catch (error) {
    console.error("Error getting token balance history:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
}

/**
 * Record balance in history (helper function)
 */
async function recordBalanceHistory(userAddress, balance) {
  try {
    // Check if we already have a record for this timestamp (within same minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // Check if user exists first to avoid foreign key constraint violation
    const userExists = await db
      .select({ id: UsersModel.id })
      .from(UsersModel)
      .where(eq(UsersModel.address, userAddress))
      .limit(1);

    if (userExists.length === 0) {
      // User not found, skip recording history
      return;
    }

    const recentRecord = await db
      .select()
      .from(TokenBalanceHistoryModel)
      .where(eq(TokenBalanceHistoryModel.userAddress, userAddress))
      .orderBy(desc(TokenBalanceHistoryModel.timestamp))
      .limit(1);

    // Only record if:
    // 1. No previous record exists, OR
    // 2. Balance has changed, OR
    // 3. Last record is older than 1 hour
    const shouldRecord =
      !recentRecord ||
      recentRecord.length === 0 ||
      recentRecord[0].balance !== balance ||
      new Date(recentRecord[0].timestamp) < oneMinuteAgo;

    if (shouldRecord) {
      await db.insert(TokenBalanceHistoryModel).values({
        userAddress: userAddress,
        balance: balance.toString(),
      });
    }
  } catch (error) {
    console.error("Error recording balance history:", error);
    // Don't throw - this is a background operation
  }
}

/**
 * Format date for chart labels
 */
function formatDate(date) {
  const d = new Date(date);
  const month = d.toLocaleString('default', { month: 'short' });
  const day = d.getDate();
  return `${month} ${day}`;
}

module.exports = {
  getBalance,
  getBalanceHistory,
  recordBalanceHistory, // Export for use in other handlers
};

