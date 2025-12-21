const { db } = require('../config/db');
const { OrganisationModel } = require('../models/OrganisationModel');
const { eq } = require('drizzle-orm');
const { ethers } = require('ethers');

/**
 * Record an investment in an organization
 * This is called after a successful token transfer to the organization owner
 */
async function recordInvestment(req, res) {
    console.log('Recording investment');
    try {
        const { organisationId, amount, txHash } = req.body;
        const investorAddress = req.walletAddress || req.body.investorAddress;

        if (!organisationId || !amount || !investorAddress) {
            return res.status(400).json({
                error: 'Missing required fields: organisationId, amount, investorAddress'
            });
        }

        // Get the organization
        const org = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(organisationId)))
            .limit(1);

        if (org.length === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        const organisation = org[0];

        // Convert amount to wei string if it's not already
        const amountInWei = typeof amount === 'string' ? amount : ethers.parseEther(amount.toString()).toString();

        // Calculate new total
        const currentFunds = BigInt(organisation.addedFunds || '0');
        const additionalFunds = BigInt(amountInWei);
        const newTotal = (currentFunds + additionalFunds).toString();

        // Update the organization's addedFunds
        await db.update(OrganisationModel)
            .set({
                addedFunds: newTotal,
                updatedAt: new Date()
            })
            .where(eq(OrganisationModel.id, parseInt(organisationId)));

        console.log(`Investment recorded: ${amountInWei} wei added to org ${organisationId}`);
        console.log(`Previous total: ${currentFunds.toString()}, New total: ${newTotal}`);

        return res.status(200).json({
            success: true,
            message: 'Investment recorded successfully',
            organisationId: parseInt(organisationId),
            amountAdded: amountInWei,
            totalFunds: newTotal,
            txHash
        });

    } catch (error) {
        console.error('Error recording investment:', error);
        return res.status(500).json({
            error: 'Failed to record investment',
            details: error.message
        });
    }
}

/**
 * Get organization's available funds (owner balance - addedFunds)
 * This shows the owner's personal balance separate from invested funds
 */
async function getOrganisationFunds(req, res) {
    console.log('Getting organisation funds');
    try {
        const { id } = req.params;

        // Get the organization
        const org = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (org.length === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        const organisation = org[0];
        const addedFunds = organisation.addedFunds || '0';

        // Note: To get owner's actual balance, you'd need to query the blockchain
        // This endpoint returns the tracked invested funds
        return res.status(200).json({
            organisationId: parseInt(id),
            ownerAddress: organisation.owner,
            addedFunds: addedFunds,
            addedFundsEther: ethers.formatEther(addedFunds)
        });

    } catch (error) {
        console.error('Error getting organisation funds:', error);
        return res.status(500).json({
            error: 'Failed to get organisation funds',
            details: error.message
        });
    }
}

module.exports = {
    recordInvestment,
    getOrganisationFunds
};
