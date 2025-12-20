const express = require("express");
const requireWalletAuth = require("../middleware/requireWalletAuth");
const { createSession, getSession, getActiveSessionForOrg, endSession, joinSession } = require("../handlers/RegistrationSessionHandler");
const registrationSessionRouter = express.Router();

registrationSessionRouter.post("/create", requireWalletAuth, createSession);
registrationSessionRouter.post("/join/:sessionId", joinSession)

registrationSessionRouter.get("/active/:orgId", getActiveSessionForOrg);
registrationSessionRouter.get("/:sessionId", getSession);
registrationSessionRouter.post("/:sessionId/end", requireWalletAuth, endSession);

module.exports = registrationSessionRouter;
