const express = require("express");
const router = express.Router();
const authRouter = require("./AuthRouter");
const forestRouter = require("./ForestRouter");

// Auth routes
router.use("/auth", authRouter);

// Forest routes (example of protected routes using wallet auth)
router.use("/forests", forestRouter);

module.exports = router;