const express = require("express");
const router = express.Router();
const requireWalletAuth = require("../middleware/requireWalletAuth");
const optionalWalletAuth = require("../middleware/optionalWalletAuth");
const {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead
} = require("../handlers/NotificationHandler");

// Get user notifications - NO SIGNATURE REQUIRED
router.get("/", optionalWalletAuth, getUserNotifications);

// Mark notification as read - REQUIRES SIGNATURE
router.put("/:id/read", requireWalletAuth, markNotificationRead);

// Mark all notifications as read - REQUIRES SIGNATURE
router.put("/read-all", requireWalletAuth, markAllNotificationsRead);

module.exports = router;

