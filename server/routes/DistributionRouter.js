express = require('express');
const router = express.Router();
const {
    distributeOrganisationFunds,
    getDistributionStatus,
    canDistribute
} = require('../handlers/DistributionHandler');
const requireWalletAuth = require('../middleware/requireWalletAuth');

// Distribute organization funds (requires owner authentication)
router.post('/organisation/:id/distribute', requireWalletAuth, distributeOrganisationFunds);

// Get distribution status
router.get('/organisation/:id/status', getDistributionStatus);

// Check if user can distribute
router.get('/organisation/:id/can-distribute', requireWalletAuth, canDistribute);

module.exports = router;
