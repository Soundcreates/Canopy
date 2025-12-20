const express = require("express");
const router = express.Router();
const requireWalletAuth = require("../middleware/requireWalletAuth");
const { registerForest, getForests, registerForestAsOrganisation } = require("../handlers/ForestHandler");

router.post("/register", requireWalletAuth, registerForest);
router.get("/getForests", requireWalletAuth, getForests);
router.post("/registerAsOrganisation", requireWalletAuth, registerForestAsOrganisation);

//real time voting and regstering routes

module.exports = router;
