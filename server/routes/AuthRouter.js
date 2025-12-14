const express = require("express");
const router = express.Router();
const { verifyWalletSignature } = require("../utils/walletVerification");

/**
 * POST /api/auth/verify
 * 
 * Verifies that the caller owns the Ethereum wallet they claim.
 * 
 * Request body:
 * {
 *   "address": "0x...",      // Ethereum address
 *   "message": "Sign this...", // Message that was signed
 *   "signature": "0x..."       // Signature from MetaMask
 * }
 * 
 * Returns:
 * - 200: Success with verification result
 * - 401: Signature verification failed
 * - 400: Missing required fields
 */
router.post("/verify", (req, res) => {
    console.log("Verifying wallet signature");
  const { address, message, signature } = req.body;

  // Validate required fields
  if (!address || !message || !signature) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["address", "message", "signature"]
    });
  }

  // Verify the signature cryptographically
  // This proves the caller owns the private key for the given address
  const isValid = verifyWalletSignature(address, message, signature);

  if (!isValid) {
    return res.status(401).json({
      error: "Signature verification failed",
      message: "The signature does not match the provided address. The caller does not own this wallet."
    });
  }

  // Success! The caller has proven ownership of the wallet
  // For MVP, we return a simple success response
  // In production, you might issue a JWT here, but we're keeping it minimal
  res.json({
    success: true,
    message: "Wallet ownership verified",
    address: address.toLowerCase() // Return normalized address
  });
});

module.exports = router;