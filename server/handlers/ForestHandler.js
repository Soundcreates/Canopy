const ForestRegistryContext = require('../contexts/ForestRegistryContext');
const { ForestModel } = require('../models/ForestModel');
const { UsersModel } = require('../models/UserModel');
const { OrganisationModel } = require('../models/OrganisationModel');
const { db } = require('../config/db');
const { eq, sql } = require('drizzle-orm');

async function registerForest(req, res) {
    console.log("Forest is being registered");
    let { area, geoHash, organisationId } = req.body;
    const ownerAddress = req.walletAddress || req.body.account;
    console.log("Owner address: ", ownerAddress);
    console.log("Organisation ID: ", organisationId);

    if (!area || !geoHash) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert area to integer (smart contract expects uint, not float)
    // Use Math.floor to ensure we don't round up (safer for large numbers)
    const areaInteger = Math.floor(Number(area));
    if (isNaN(areaInteger) || areaInteger <= 0) {
        return res.status(400).json({ error: 'Invalid area value. Area must be a positive number.' });
    }
    console.log("Area converted to integer:", areaInteger, "(original:", area, ")");

    try {
        //i will need to first create an instance of the forestregistrycontext 
        console.log("Recovering forest id");
        const forestRegistryContext = new ForestRegistryContext(process.env.RPC_URL, process.env.ORACLE_PRIVATE_KEY);
        console.log("Forest registry context created");
        const { hash, forestId } = await forestRegistryContext.registerForest(areaInteger, geoHash);
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

        const forestValues = {
            forestId,
            owner: ownerAddress.toLowerCase(), // Store in lowercase for consistency
            area: areaInteger, // Area as bigint in database (supports large values, matches contract uint)
            geoHash,
            txHash: hash,
            isActive: true
        };

        // Add organisationId if provided
        if (organisationId) {
            forestValues.organisationId = parseInt(organisationId);
            console.log("Forest will be linked to organisation ID:", organisationId);
        }

        const forest = await db.insert(ForestModel).values(forestValues).returning();
        console.log("Entry created in the database (forest table)");
        //returning the success message and the forest object
        return res.status(200).json({ message: 'Forest registered successfully', forest: forest });
    } catch (error) {
        console.error("Error registering forest:", error);
        return res.status(500).json({ error: 'Failed to register forest', details: error.message });
    }
}

async function getForests(req, res) {
    console.log("Getting forests");
    try {
        let ownerAddress = req.walletAddress;
        console.log("Owner address: ", ownerAddress);
        if (!ownerAddress) {
            return res.status(400).json({ error: 'Wallet not connected' });
        }
        // Use drizzle's eq function for where clause
        const forests = await db.select()
            .from(ForestModel)
            .where(eq(ForestModel.owner, ownerAddress.toLowerCase()));
        console.log("Forests: ", forests);
        return res.status(200).json({ forests: forests });
    } catch (error) {
        console.error("Error getting forests:", error);
        return res.status(500).json({ error: 'Failed to get forests', details: error.message });
    }
}

async function registerForestAsOrganisation(req, res) {
    console.log("Registering forest as organization");
    const { forestId, orgId } = req.body;
    const walletAddress = req.walletAddress;

    console.log("Forest ID:", forestId);
    console.log("Organization ID:", orgId);
    console.log("Wallet Address:", walletAddress);

    if (!forestId || !orgId) {
        return res.status(400).json({ error: 'Missing required fields: forestId and orgId' });
    }

    try {
        // Verify the forest exists
        const forest = await db.select()
            .from(ForestModel)
            .where(eq(ForestModel.forestId, forestId))
            .limit(1);

        if (forest.length === 0) {
            return res.status(404).json({ error: 'Forest not found' });
        }

        console.log("Forest found:", forest[0]);

        // Verify the organization exists
        const organisation = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, orgId))
            .limit(1);

        if (organisation.length === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        console.log("Organization found:", organisation[0]);

        // Check if the user is the owner of the organization
        if (organisation[0].owner.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Only the organization owner can register forests' });
        }

        // Check if forest is already registered to this organization
        const currentForests = organisation[0].forests || [];
        if (currentForests.includes(forestId)) {
            return res.status(400).json({ error: 'Forest is already registered to this organization' });
        }

        // Update the organization's forests array by appending the new forestId
        const updatedOrg = await db.update(OrganisationModel)
            .set({
                forests: sql`array_append(${OrganisationModel.forests}, ${forestId})`,
                updatedAt: new Date()
            })
            .where(eq(OrganisationModel.id, orgId))
            .returning();

        console.log("Organization updated with new forest:", updatedOrg[0]);

        return res.status(200).json({
            message: 'Forest registered to organization successfully',
            organisation: updatedOrg[0]
        });
    } catch (error) {
        console.error("Error registering forest to organization:", error);
        return res.status(500).json({ error: 'Failed to register forest to organization', details: error.message });
    }
}


module.exports = { registerForest, getForests, registerForestAsOrganisation };