const express = require("express");
const router = express.Router();
const { searchUsers } = require("../handlers/UserHandler");

// Search users - NO AUTH REQUIRED (public endpoint)
router.get("/search", searchUsers);

module.exports = router;

