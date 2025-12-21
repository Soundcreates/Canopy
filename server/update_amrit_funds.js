const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { OrganisationModel } = require('./models/OrganisationModel');
const { eq } = require('drizzle-orm');
const { ethers } = require('ethers');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function updateAmritFunds() {
    try {
        console.log('Updating amrit organization funds to 100 CTK...\n');

        // Convert 100 CTK to wei
        const amountInWei = ethers.parseEther('100').toString();
        console.log(`100 CTK in wei: ${amountInWei}`);

        // Update the amrit organization (ID: 10)
        const updated = await db.update(OrganisationModel)
            .set({
                addedFunds: amountInWei,
                updatedAt: new Date()
            })
            .where(eq(OrganisationModel.id, 10))
            .returning();

        if (updated.length > 0) {
            console.log('\n✅ Successfully updated!');
            console.log(`Organization: ${updated[0].name}`);
            console.log(`Added Funds: ${updated[0].addedFunds} wei`);
            console.log(`Added Funds: ${ethers.formatEther(updated[0].addedFunds)} CTK`);
        } else {
            console.log('❌ No organization found with ID 10');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateAmritFunds();
