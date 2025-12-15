const express = require("express");
const router = express.Router();
const requireWalletAuth = require("../middleware/requireWalletAuth");
const { registerForest } = require("../handlers/ForestHandler");


router.post("/register", requireWalletAuth, registerForest);


module.exports = router;

