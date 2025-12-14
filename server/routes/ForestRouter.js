const express = require("express");
const router = express.Router();
const requireWalletAuth = require("../middleware/requireWalletAuth");

/**
 * POST /api/forests
 * 
 * Example protected route that requires wallet authentication.
 * 
 * The requireWalletAuth middleware verifies the signature before
 * this handler runs. If verification fails, the middleware returns
 * 401 and this handler never executes.
 * 
 * After successful verification, req.walletAddress contains the
 * verified Ethereum address of the caller.
 */
router.post("/register", requireWalletAuth, (req, res) => {
  // At this point, we know the caller owns the wallet at req.walletAddress
  // because the middleware verified the signature
  console.log("ForestRouter is in action");
  const { area, geoHash } = req.body;
  const ownerAddress = req.walletAddress; // Verified address from middleware

  // Validate required fields
  if (!area || !geoHash) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["area", "geoHash"]
    });
  }

  // In a real implementation, you would:
  // 1. Store the forest data in your database
  // 2. Associate it with req.walletAddress as the owner
  // 3. Maybe interact with your smart contract
  
  // For MVP example, just return success
  res.json({
    success: true,
    message: "Forest registered",
    owner: ownerAddress,
    forest: {
      area,
      geoHash
    }
  });
});

module.exports = router;

