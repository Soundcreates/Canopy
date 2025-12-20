const express = require("express");
const requireWalletAuth = require("../middleware/requireWalletAuth");
const { createSession, getSession, endSession } = require("../handlers/RegistrationSessionHandler");
const registrationSessionRouter = express.Router();

registrationSessionRouter.post("/create", requireWalletAuth, createSession);
registrationSessionRouter.get("/:sessionId", getSession);
registrationSessionRouter.post("/:sessionId/end", requireWalletAuth, endSession);

module.exports = registrationSessionRouter;

