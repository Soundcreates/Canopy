const { verifyWalletSignature } = require("../utils/walletVerification");

/**
 * Middleware to protect routes that require wallet authentication.
 * 
 * Expects the request to include wallet verification in one of these ways:
 * 1. In the request body (for POST/PUT requests)
 * 2. In the Authorization header as: "Bearer <address>:<message>:<signature>"
 * 
 * After verification, attaches the verified address to req.walletAddress
 * for use in route handlers.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requireWalletAuth(req, res, next) {
    console.log("Middleware requireWalletAuth is in action");
  let address, message, signature;

  // Try to get auth data from request body first (for POST/PUT)
  if (req.body && req.body.address && req.body.message && req.body.signature) {
    address = req.body.address;
    message = req.body.message;
    signature = req.body.signature;
  } 
  // Otherwise, try to get it from Authorization header
  else if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    
    // Remove "Bearer " prefix if present
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : authHeader;
    
    // Parse format: "address:message:signature"
    const parts = token.split(":");
    if (parts.length === 3) {
      [address, message, signature] = parts;
    } else {
      return res.status(401).json({
        error: "Invalid authorization format",
        message: "Expected format: Bearer <address>:<message>:<signature>"
      });
    }
  } 
  // No auth data found
  else {
    return res.status(401).json({
      error: "Wallet authentication required",
      message: "Provide wallet verification in request body or Authorization header"
    });
  }

  // Verify the signature
  const isValid = verifyWalletSignature(address, message, signature);

  if (!isValid) {
    return res.status(401).json({
      error: "Signature verification failed",
      message: "The signature does not match the provided address"
    });
  }

  // Attach verified address to request for use in route handlers
  req.walletAddress = address.toLowerCase();
  next();
}

module.exports = requireWalletAuth;

