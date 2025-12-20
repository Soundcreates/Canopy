const { db } = require("../config/db");
const { eq } = require("drizzle-orm");
const { UsersModel } = require("../models/UserModel");
const { tokenService } = require("../utils/tokenService");

async function saveProfile(req, res) {
  console.log("Saving profile from backend");
  try {
    const { displayName } = req.body;
    const originalAddress = req.walletAddress;
    
    // Normalize address to lowercase for consistency
    const normalizedAddress = originalAddress.toLowerCase();
    
    //checking if existing user is there or not
    console.log("Checking if user exists or not");
    const existingUser = await db
      .select()
      .from(UsersModel)
      .where(eq(UsersModel.address, normalizedAddress))
      .limit(1);
      
    if (!existingUser || existingUser.length === 0) {
      console.log("User does not exist, creating user");
      // Create user if they don't exist
      const newUser = await db
        .insert(UsersModel)
        .values({
          address: normalizedAddress,
          displayName: displayName || "Anonymous User",
        })
        .returning();
      
      console.log("User created");
      
      // Mint signup bonus (500 tokens) - fire and forget, don't block response
      tokenService.mintSignupBonus(normalizedAddress).catch(err => {
        console.error("Error minting signup bonus (non-blocking):", err);
      });
      
      return res
        .status(201)
        .json({ message: "User profile created", user: newUser[0] });
    }
    
    console.log("Contacting database since user exists");
    //now since we know that the user exists, update their profile
    const updatedUser = await db
      .update(UsersModel)
      .set({ displayName: displayName })
      .where(eq(UsersModel.address, normalizedAddress))
      .returning();

    console.log("User has been updated");
    return res
      .status(200)
      .json({ message: "User has been updated", user: updatedUser[0] });
  } catch (error) {
    console.error("Error saving profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getProfile(req, res) {
  console.log("getting user profile from backend");
  try {
    const { address } = req.query;
    
    // Validate address parameter
    if (!address || address === "null" || address === "undefined") {
      console.log("Address parameter missing or invalid");
      return res.status(400).json({ 
        error: "Address parameter is required",
        message: "Please provide a valid wallet address" 
      });
    }

    // Normalize address to lowercase for consistent querying
    const normalizedAddress = address.toLowerCase();
    
    const user = await db
      .select()
      .from(UsersModel)
      .where(eq(UsersModel.address, normalizedAddress))
      .limit(1);
      
    if (!user || user.length === 0) {
      console.log("User does not exist");
      // Return 404 instead of 400 for not found
      return res.status(404).json({ 
        error: "User not found",
        message: "User profile does not exist. Please create a profile first." 
      });
    }
    
    console.log("User found");
    return res.status(200).json({ message: "User found", user: user[0] });
  } catch (error) {
    console.error("Error getting profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  saveProfile,
  getProfile,
};
