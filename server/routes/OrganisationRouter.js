const express = require("express");
const router = express.Router();
const requireWalletAuth = require("../middleware/requireWalletAuth");
const optionalWalletAuth = require("../middleware/optionalWalletAuth");
const {
    createOrganisation,
    getOrganisations,
    getOrganisationById,
    updateOrganisation,
    addMembers,
    removeMember,
    deleteOrganisation,
    getMarketplaceOrganisations
} = require("../handlers/OrganisationHandler");

// Create a new organisation - REQUIRES SIGNATURE
router.post("/create", requireWalletAuth, createOrganisation);

// Get marketplace organisations (public, all active orgs) - NO AUTH REQUIRED
router.get("/marketplace", getMarketplaceOrganisations);

// Get all organisations for the authenticated user - NO SIGNATURE REQUIRED
router.get("/", optionalWalletAuth, getOrganisations);

// Get a specific organisation by ID - NO SIGNATURE REQUIRED
router.get("/:id", optionalWalletAuth, getOrganisationById);

// Update an organisation - REQUIRES SIGNATURE
router.put("/:id", requireWalletAuth, updateOrganisation);

// Add members (owners or users) to an organisation - REQUIRES SIGNATURE
router.post("/:id/members", requireWalletAuth, addMembers);

// Remove a member from an organisation - REQUIRES SIGNATURE
router.delete("/:id/members/:memberAddress", requireWalletAuth, removeMember);

// Delete an organisation (soft delete) - REQUIRES SIGNATURE
router.delete("/:id", requireWalletAuth, deleteOrganisation);

module.exports = router;

