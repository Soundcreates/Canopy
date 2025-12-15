const express = require("express");
const router = express.Router();
const authRouter = require("./AuthRouter");
const forestRouter = require("./ForestRouter");
const ndviRouter = require("./NDVIRouter");

// Auth routes
router.use("/auth", authRouter);

// Forest routes (example of protected routes using wallet auth)
router.use("/forests", forestRouter);

// NDVI routes
router.use("/ndvi", ndviRouter);

module.exports = router;