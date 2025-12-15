const {verifyMessage} = require('ethers');

async function requireWalletAuth(req, res, next) {
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
    const token = authHeader.startsWith("Bearer ")  //bascially here we are passing the signed message in the bearer token section
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

  // Validate signature format (should be hex string starting with 0x)
  if (!signature || !signature.startsWith('0x') || signature.length < 130) {
    console.log("Invalid signature format in middleware - signature should be a hex string starting with 0x");
    return res.status(400).json({
      error: "Invalid signature format",
      message: "Signature must be a valid hex string starting with 0x"
    });
  }

  // Verify the signature
  console.log("Middleware: Verifying signature for address:", address);
  try {
    // verifyMessage takes (message, signature) and returns the recovered address
    const recoveredAddr = verifyMessage(message, signature);
    console.log("Middleware: Recovered address:", recoveredAddr);
    console.log("Middleware: Provided address:", address);

    // Compare addresses case-insensitively
    if (recoveredAddr.toLowerCase() !== address.toLowerCase()) {
      console.log("Middleware: Signature verification failed - addresses do not match");
      return res.status(401).json({
        error: "Signature verification failed",
        message: "The signature does not match the provided address"
      });
    }
    console.log("Middleware: Signature verified successfully!");
  } catch (error) {
    console.log("Middleware: Error verifying signature:", error);
    return res.status(401).json({
      error: "Signature verification failed",
      message: "Invalid signature format or corrupted data",
      details: error.message
    });
  }

  // Attach verified address to request for use in route handlers
  req.walletAddress = address.toLowerCase();
  next();
}

module.exports = requireWalletAuth;

