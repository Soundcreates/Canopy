const {verifyMessage} = require('ethers');

/**
 * Optional wallet authentication middleware
 * For GET requests - doesn't require signature, just verifies wallet connection
 * Falls back to checking wallet address from query params or headers
 */
async function optionalWalletAuth(req, res, next) {
  console.log("Middleware optionalWalletAuth is in action");
  
  // Try to get address from various sources
  let address = null;
  
  // 1. From query params (for GET requests)
  if (req.query.address) {
    address = req.query.address.toLowerCase();
  }
  // 2. From Authorization header (if provided, but signature is optional)
  else if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    
    // Parse format: "address" or "address:message:signature"
    const parts = token.split(":");
    if (parts.length === 1) {
      // Just address, no signature required
      address = parts[0].toLowerCase();
    } else if (parts.length === 3) {
      // Full auth with signature (optional but verified if provided)
      const [addr, message, signature] = parts;
      
      if (signature && signature.startsWith('0x') && signature.length >= 130) {
        try {
          const recoveredAddr = verifyMessage(message, signature);
          if (recoveredAddr.toLowerCase() === addr.toLowerCase()) {
            address = addr.toLowerCase();
            console.log("Optional auth: Signature verified");
          }
        } catch (error) {
          console.log("Optional auth: Signature verification failed, continuing without auth");
        }
      } else {
        address = addr.toLowerCase();
      }
    }
  }
  // 3. From request body (for POST requests that might not need full auth)
  else if (req.body && req.body.address) {
    address = req.body.address.toLowerCase();
  }

  // Attach address if found (can be null for public endpoints)
  if (address) {
    req.walletAddress = address;
    console.log("Optional auth: Wallet address found:", address);
  } else {
    console.log("Optional auth: No wallet address provided, continuing without auth");
  }
  
  next();
}

module.exports = optionalWalletAuth;

