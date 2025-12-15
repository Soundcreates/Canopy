const ForestRegistryContext = require('../contexts/ForestRegistryContext');
const {ForestModel} = require('../models/ForestModel');
const {UsersModel} = require('../models/UserModel');
const { db } = require('../config/db');
const { eq } = require('drizzle-orm');

async function registerForest(req,res) {
    console.log("Forest is being registered");
    const {area, geoHash} = req.body;
    const ownerAddress = req.walletAddress;
    if(!area || !geoHash) {
        return res.status(400).json({error: 'Missing required fields'});
    }

    try {
        //i will need to first create an instance of the forestregistrycontext 
        console.log("Recovering forest id");
        const forestRegistryContext = new ForestRegistryContext(process.env.RPC_URL, process.env.ORACLE_PRIVATE_KEY);
        console.log("Forest registry context created");
        const {hash, forestId} = await forestRegistryContext.registerForest(area, geoHash);
        console.log("Forest id: ", forestId);
        console.log("Hash: ", hash);
        
        // Ensure the user exists in the users table (required by foreign key constraint)
        console.log("Checking if user exists in database");
        const existingUser = await db.select()
            .from(UsersModel)
            .where(eq(UsersModel.address, ownerAddress))
            .limit(1);
        
        if (existingUser.length === 0) {
            console.log("User not found, creating user in database");
            await db.insert(UsersModel).values({
                address: ownerAddress
            });
            console.log("User created in database");
        } else {
            console.log("User already exists in database");
        }
        
        //creating the entry in the forestTable
        console.log("Creating an entry in the database (forest table)");
        //using drizzle to create the entry in the database
        
        const forest = await db.insert(ForestModel).values({
            forestId,
            owner: ownerAddress,
            area,
            geoHash,
            txHash: hash,
            isActive: true
        }).returning();
        console.log("Entry created in the database (forest table)");
        //returning the success message and the forest object
        return res.status(200).json({message: 'Forest registered successfully', forest: forest});
    } catch (error) {
        console.error("Error registering forest:", error);
        return res.status(500).json({error: 'Failed to register forest', details: error.message});
    }
}

module.exports = { registerForest };