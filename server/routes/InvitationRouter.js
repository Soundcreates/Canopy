const express = require("express");
const router = express.Router();
const requireWalletAuth = require("../middleware/requireWalletAuth");
const optionalWalletAuth = require("../middleware/optionalWalletAuth");
const {
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    getUserInvitations
} = require("../handlers/InvitationHandler");

// Send an invitation - REQUIRES SIGNATURE
router.post("/organisation/:id/invite", requireWalletAuth, sendInvitation);

// Accept an invitation - REQUIRES SIGNATURE
router.post("/:id/accept", requireWalletAuth, acceptInvitation);

// Reject an invitation - REQUIRES SIGNATURE
router.post("/:id/reject", requireWalletAuth, rejectInvitation);

// Get user invitations - NO SIGNATURE REQUIRED
router.get("/", optionalWalletAuth, getUserInvitations);

module.exports = router;

