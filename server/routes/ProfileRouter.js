const express = require("express");
const requireWalletAuth = require("../middleware/requireWalletAuth");
const { getProfile, saveProfile } = require("../handlers/ProfileHandler");
const profileRouter = express.Router();

profileRouter.post("/updateProfile", requireWalletAuth, saveProfile);
profileRouter.get("/getProfile", getProfile);

module.exports = profileRouter;
