const {verifyMessage} = require('ethers');
const { db } = require('../config/db');
const { UsersModel } = require('../models/UserModel');
const { eq } = require('drizzle-orm');
const { tokenService } = require('../utils/tokenService');

async function requireWalletAuth(req, res, next) {
    console.log("Middleware requireWalletAuth is in action");
  let address, message, signature;
  // Try to get auth data from request body first (for POST/PUT)
  if (req.body && req.body.address && req.body.message && req.body.signature) {
    console.log("trying to take from request body");
    address = req.body.address;
    message = req.body.message;
    signature = req.body.signature;
  } 
  // Otherwise, try to get it from Authorization header
  else if (req.headers.authorization) {
    console.log("trying to take from authorization header");
    const authHeader = req.headers.authorization;
    
    // Remove "Bearer " prefix if present
    console.log("Removing bearer prefix");
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
  } else if(req.query && req.query.address) {
    console.log("Taking address from query");
     address = req.query.address;
     
     console.log("Address from query:", address);
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

  // Normalize address to lowercase for consistency
  const normalizedAddress = address.toLowerCase();
  
  // Check if user exists, if not create them automatically
  try {
    const existingUser = await db
      .select()
      .from(UsersModel)
      .where(eq(UsersModel.address, normalizedAddress))
      .limit(1);
    
    if (!existingUser || existingUser.length === 0) {
      console.log("Middleware: User does not exist, creating new user account");
      // Create user automatically
      const newUser = await db
        .insert(UsersModel)
        .values({
          address: normalizedAddress,
          displayName: "Anonymous User", // Default display name
        })
        .returning();
      
      console.log("Middleware: New user account created:", newUser[0].address);
      
      // Mint signup bonus (500 tokens) - fire and forget, don't block request
      tokenService.mintSignupBonus(normalizedAddress).catch(err => {
        console.error("Middleware: Error minting signup bonus (non-blocking):", err);
      });
    } else {
      console.log("Middleware: User already exists:", normalizedAddress);
    }
  } catch (dbError) {
    // Log error but don't block the request - user creation is not critical for auth
    console.error("Middleware: Error checking/creating user (non-blocking):", dbError);
  }

  // Attach verified address to request for use in route handlers
  req.walletAddress = normalizedAddress;
  next();
}

module.exports = requireWalletAuth;

