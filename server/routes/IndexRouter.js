const express = require("express");
const router = express.Router();
const authRouter = require("./AuthRouter");
const forestRouter = require("./ForestRouter");
const ndviRouter = require("./NDVIRouter");
const lulcRouter = require("./LULCRouter");
const organisationRouter = require("./OrganisationRouter");
const profileRouter = require("./ProfileRouter");
const registrationSessionRouter = require("./RegistrationSessionRouter");
const invitationRouter = require("./InvitationRouter");
const notificationRouter = require("./NotificationRouter");
const userRouter = require("./UserRouter");
const tokenRouter = require("./TokenRouter");

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

//Profile routes
router.use('/profile', profileRouter);

// Registration Session routes
router.use('/registration-sessions', registrationSessionRouter);

// Invitation routes
router.use("/invitations", invitationRouter);

// Notification routes
router.use("/notifications", notificationRouter);

// User routes
router.use("/users", userRouter);

// Token routes
router.use("/token", tokenRouter);

module.exports = router;