const { verifyMessage } = require('ethers');
const { db } = require('../config/db');
const { UsersModel } = require('../models/UserModel');
const { eq } = require('drizzle-orm');
const { tokenService } = require('../utils/tokenService');

async function verifyAuth(req, res) {
    console.log("AuthHandler is in action");
    //getting the address, message and signature from the request body
    const { address, message, signature } = req.body;
    console.log("Address: ", address);
    console.log("Message: ", message);
    console.log("Signature: ", signature);
    //small error handling
    if (!address || !message || !signature) {
        console.log("Some fields are absent!");
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Validate signature format (should be hex string starting with 0x)
    if (!signature.startsWith('0x') || signature.length < 130) {
        console.log("Invalid signature format - signature should be a hex string starting with 0x");
        return res.status(400).json({ error: 'Invalid signature format' });
    }

    //try and caatch error handling for the verification of the signature passed from the fronted
    console.log("Trying to verify the signature");
    try {
        console.log("Verifying the signature");
        // verifyMessage takes (message, signature) and returns the recovered address
        const recoveredAddress = verifyMessage(message, signature);
        console.log("Recovered Address: ", recoveredAddress);
        console.log("Provided Address: ", address);
        
        // Compare addresses case-insensitively
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            console.log("Invalid signature - addresses do not match");
            return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log("Signature verified successfully!");
    } catch (error) {
        console.log("Error verifying the signature: ", error);
        return res.status(401).json({ error: 'Invalid signature', details: error.message });
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
            console.log("AuthHandler: User does not exist, creating new user account");
            // Create user automatically
            const newUser = await db
                .insert(UsersModel)
                .values({
                    address: normalizedAddress,
                    displayName: "Anonymous User", // Default display name
                })
                .returning();
            
            console.log("AuthHandler: New user account created:", newUser[0].address);
            
            // Mint signup bonus (500 tokens) - fire and forget, don't block response
            tokenService.mintSignupBonus(normalizedAddress).catch(err => {
                console.error("AuthHandler: Error minting signup bonus (non-blocking):", err);
            });
            
            //if this gets executed, that means the recoveredAddr ==  clients addr
            return res.status(200).json({ 
                message: 'Authentication successful', 
                userCreated: true,
                user: newUser[0],
                signupBonus: '500 tokens will be minted to your account'
            });
        } else {
            console.log("AuthHandler: User already exists:", normalizedAddress);
        }
    } catch (dbError) {
        // Log error but don't block the response - user creation is not critical for auth
        console.error("AuthHandler: Error checking/creating user (non-blocking):", dbError);
    }

    //if this gets executed, that means the recoveredAddr ==  clients addr
    return res.status(200).json({ message: 'Authentication successful' });
}


module.exports = { verifyAuth };
