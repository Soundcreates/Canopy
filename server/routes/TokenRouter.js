const express = require("express");
const router = express.Router();
const { getBalance, getBalanceHistory } = require("../handlers/TokenHandler");
const optionalWalletAuth = require("../middleware/optionalWalletAuth");

// Get current token balance
router.get("/balance", optionalWalletAuth, getBalance);

// Get token balance history
router.get("/history", optionalWalletAuth, getBalanceHistory);

module.exports = router;

