const express = require("express");
const router = express.Router();
const { verifyAuth } = require("../handlers/AuthHandler");


router.post("/verify", verifyAuth);


module.exports = router;