const express = require('express');
const router = express.Router();
const { recordInvestment, getOrganisationFunds } = require('../handlers/InvestmentHandler');
const optionalWalletAuth = require('../middleware/optionalWalletAuth');
const requireWalletAuth = require('../middleware/requireWalletAuth');

// Record an investment (requires authentication)
router.post('/record', requireWalletAuth, recordInvestment);

// Get organization funds
router.get('/organisation/:id/funds', getOrganisationFunds);

module.exports = router;
