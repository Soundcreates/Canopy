const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { OrganisationModel } = require('./models/OrganisationModel');
const { eq } = require('drizzle-orm');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function checkOrgFunds() {
    try {
        console.log('Checking organization funds...\n');

        // Get all organizations with their addedFunds
        const orgs = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.isActive, true));

        console.log('Active Organizations:');
        console.log('====================\n');

        orgs.forEach(org => {
            console.log(`ID: ${org.id}`);
            console.log(`Name: ${org.name}`);
            console.log(`Owner: ${org.owner}`);
            console.log(`Added Funds (wei): ${org.addedFunds || '0'}`);

            // Convert to ether if not 0
            if (org.addedFunds && org.addedFunds !== '0') {
                try {
                    const fundsInEther = parseFloat((BigInt(org.addedFunds) / BigInt(10 ** 18)).toString());
                    console.log(`Added Funds (ether): ${fundsInEther} CTK`);
                } catch (e) {
                    console.log(`Error converting: ${e.message}`);
                }
            }
            console.log('---\n');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkOrgFunds();
