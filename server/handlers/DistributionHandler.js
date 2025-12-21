const { db } = require('../config/db');
const { OrganisationModel, OrganisationMemberModel } = require('../models/OrganisationModel');
const { eq, and, isNull, lt } = require('drizzle-orm');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Distribute organization funds equally among all members and investors
 */
async function distributeOrganisationFunds(req, res) {
    console.log('Distributing organisation funds');
    try {
        const { id } = req.params;
        const userAddress = req.walletAddress;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Get organization
        const org = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (org.length === 0) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        const organisation = org[0];

        // Check if user is owner
        if (organisation.owner.toLowerCase() !== userAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Only the owner can distribute funds' });
        }

        // Check if distribution already completed
        if (organisation.distributionCompleted) {
            return res.status(400).json({
                error: 'Funds already distributed',
                distributionDate: organisation.distributionDate,
                txHash: organisation.distributionTxHash
            });
        }

        // Get all active members (including investors)
        const members = await db.select()
            .from(OrganisationMemberModel)
            .where(and(
                eq(OrganisationMemberModel.organisationId, parseInt(id)),
                isNull(OrganisationMemberModel.leftDate)
            ));

        if (members.length === 0) {
            return res.status(400).json({ error: 'No members to distribute funds to' });
        }

        const totalFunds = BigInt(organisation.addedFunds || '0');

        if (totalFunds === BigInt(0)) {
            return res.status(400).json({ error: 'No funds to distribute' });
        }

        // Calculate equal share per member
        const sharePerMember = totalFunds / BigInt(members.length);
        const shareInEther = ethers.formatEther(sharePerMember);

        console.log(`Distributing ${ethers.formatEther(totalFunds)} CTK to ${members.length} members`);
        console.log(`Each member receives: ${shareInEther} CTK`);

        // Load contract data
        const contractDataPath = path.join(__dirname, '../contractData/CTKToken.json');
        const contractData = JSON.parse(fs.readFileSync(contractDataPath, 'utf8'));

        // Get RPC URL and oracle private key
        const rpcUrl = process.env.RPC_URL || process.env.ETH_RPC_URL;
        const oraclePrivateKey = process.env.TOKEN_ORACLE_PRIVATE_KEY;

        if (!rpcUrl || !oraclePrivateKey) {
            return res.status(500).json({ error: 'Blockchain configuration not available' });
        }

        // Connect to blockchain
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const oracleWallet = new ethers.Wallet(oraclePrivateKey, provider);
        const ctkToken = new ethers.Contract(
            contractData.address,
            contractData.abi,
            oracleWallet
        );

        // Check owner's balance
        const ownerBalance = await ctkToken.balanceOf(organisation.owner);
        if (ownerBalance < totalFunds) {
            return res.status(400).json({
                error: 'Insufficient balance in organization treasury',
                required: ethers.formatEther(totalFunds),
                available: ethers.formatEther(ownerBalance)
            });
        }

        // Distribute funds to each member
        const distributions = [];
        let allTxHashes = [];

        for (const member of members) {
            try {
                console.log(`Transferring ${shareInEther} CTK to ${member.userAddress}`);

                // Transfer from owner to member
                // Note: This requires owner to have approved the oracle or oracle to have minting rights
                // For now, we'll use oracle's transfer capability
                const tx = await ctkToken.transfer(member.userAddress, sharePerMember);
                const receipt = await tx.wait();

                allTxHashes.push(receipt.hash);
                distributions.push({
                    address: member.userAddress,
                    amount: shareInEther,
                    txHash: receipt.hash
                });

                console.log(`✅ Transferred to ${member.userAddress}: ${receipt.hash}`);
            } catch (error) {
                console.error(`Error transferring to ${member.userAddress}:`, error);
                return res.status(500).json({
                    error: 'Distribution failed',
                    details: error.message,
                    completedDistributions: distributions
                });
            }
        }

        // Update organization record
        await db.update(OrganisationModel)
            .set({
                distributionCompleted: true,
                distributionDate: new Date(),
                distributionTxHash: allTxHashes.join(','), // Store all tx hashes
                updatedAt: new Date()
            })
            .where(eq(OrganisationModel.id, parseInt(id)));

        console.log('✅ Distribution completed successfully');

        return res.status(200).json({
            success: true,
            message: 'Funds distributed successfully',
            totalDistributed: ethers.formatEther(totalFunds),
            recipients: members.length,
            amountPerRecipient: shareInEther,
            distributions: distributions
        });

    } catch (error) {
        console.error('Error distributing funds:', error);
        return res.status(500).json({
            error: 'Failed to distribute funds',
            details: error.message
        });
    }
}

/**
 * Get distribution status for an organization
 */
async function getDistributionStatus(req, res) {
    console.log('Getting distribution status');
    try {
        const { id } = req.params;

        const org = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (org.length === 0) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        const organisation = org[0];

        return res.status(200).json({
            organisationId: parseInt(id),
            distributionCompleted: organisation.distributionCompleted,
            distributionDate: organisation.distributionDate,
            distributionTxHash: organisation.distributionTxHash,
            totalFunds: organisation.addedFunds,
            totalFundsEther: ethers.formatEther(organisation.addedFunds || '0')
        });

    } catch (error) {
        console.error('Error getting distribution status:', error);
        return res.status(500).json({
            error: 'Failed to get distribution status',
            details: error.message
        });
    }
}

/**
 * Check if organization can be distributed
 */
async function canDistribute(req, res) {
    console.log('Checking if organisation can be distributed');
    try {
        const { id } = req.params;
        const userAddress = req.walletAddress;

        const org = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (org.length === 0) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        const organisation = org[0];
        const now = new Date();
        const endDate = new Date(organisation.endDate);

        const canDistribute = {
            isOwner: organisation.owner.toLowerCase() === userAddress?.toLowerCase(),
            notDistributed: !organisation.distributionCompleted,
            hasExpired: now > endDate,
            hasFunds: BigInt(organisation.addedFunds || '0') > BigInt(0)
        };

        const allowed = canDistribute.isOwner &&
            canDistribute.notDistributed &&
            canDistribute.hasFunds;

        return res.status(200).json({
            canDistribute: allowed,
            checks: canDistribute,
            message: allowed ? 'Distribution allowed' : 'Distribution not allowed'
        });

    } catch (error) {
        console.error('Error checking distribution permission:', error);
        return res.status(500).json({
            error: 'Failed to check distribution permission',
            details: error.message
        });
    }
}

/**
 * Check and distribute expired organizations (for cron job)
 */
async function checkAndDistributeExpired() {
    console.log('Checking for expired organizations...');
    try {
        const now = new Date();

        // Find organizations that have expired and not yet distributed
        const expiredOrgs = await db.select()
            .from(OrganisationModel)
            .where(and(
                lt(OrganisationModel.endDate, now),
                eq(OrganisationModel.distributionCompleted, false),
                eq(OrganisationModel.isActive, true)
            ));

        console.log(`Found ${expiredOrgs.length} expired organizations`);

        for (const org of expiredOrgs) {
            console.log(`Auto-distributing funds for organization: ${org.name} (ID: ${org.id})`);

            // TODO: Implement automatic distribution
            // This would require calling distributeOrganisationFunds programmatically
            // For now, we'll just log it
            console.log(`Organization ${org.name} needs distribution`);
        }

        return expiredOrgs;
    } catch (error) {
        console.error('Error checking expired organizations:', error);
        throw error;
    }
}

module.exports = {
    distributeOrganisationFunds,
    getDistributionStatus,
    canDistribute,
    checkAndDistributeExpired
};
