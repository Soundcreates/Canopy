const express = require("express");
const router = express.Router();
const authRouter = require("./AuthRouter");
const forestRouter = require("./ForestRouter");
const ndviRouter = require("./NDVIRouter");
const lulcRouter = require("./LULCRouter");
const organisationRouter = require("./OrganisationRouter");

// Auth routes
router.use("/auth", authRouter);

// Forest routes (example of protected routes using wallet auth)
router.use("/forests", forestRouter);

// NDVI routes
router.use("/ndvi", ndviRouter);

// LULC (Land Use Land Cover) classification routes
router.use("/lulc", lulcRouter);

// Organisation routes
router.use("/organisations", organisationRouter);

module.exports = router;