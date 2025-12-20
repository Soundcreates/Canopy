const { InvitationModel } = require('../models/InvitationModel');
const { NotificationModel } = require('../models/NotificationModel');
const { OrganisationModel, OrganisationMemberModel } = require('../models/OrganisationModel');
const { UsersModel } = require('../models/UserModel');
const { db } = require('../config/db');
const { eq, and, or, isNull, ilike } = require('drizzle-orm');


//sends invitation
async function sendInvitation(req, res) {
    try {
        const { id } = req.params; // organisation ID
        const { inviteeAddress, role } = req.body;
        const inviterAddress = req.walletAddress;

        if (!inviterAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        if (!inviteeAddress) {
            return res.status(400).json({ error: 'Invitee address is required' });
        }

        // Check if organization exists
        const organisation = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (organisation.length === 0) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        // Check if inviter is an owner
        const member = await db.select()
            .from(OrganisationMemberModel)
            .where(and(
                eq(OrganisationMemberModel.organisationId, parseInt(id)),
                eq(OrganisationMemberModel.userAddress, inviterAddress.toLowerCase()),
                eq(OrganisationMemberModel.role, 'owner')
            ))
            .limit(1);

        if (member.length === 0 && organisation[0].owner !== inviterAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Only owners can send invitations' });
        }

        // Check if invitee is already a member
        const existingMember = await db.select()
            .from(OrganisationMemberModel)
            .where(and(
                eq(OrganisationMemberModel.organisationId, parseInt(id)),
                eq(OrganisationMemberModel.userAddress, inviteeAddress.toLowerCase()),
                isNull(OrganisationMemberModel.leftDate)
            ))
            .limit(1);

        if (existingMember.length > 0) {
            return res.status(400).json({ error: 'User is already a member of this organization' });
        }

        // Check if there's already a pending invitation
        const existingInvitation = await db.select()
            .from(InvitationModel)
            .where(and(
                eq(InvitationModel.organisationId, parseInt(id)),
                eq(InvitationModel.inviteeAddress, inviteeAddress.toLowerCase()),
                eq(InvitationModel.status, 'pending')
            ))
            .limit(1);

        if (existingInvitation.length > 0) {
            return res.status(400).json({ error: 'Invitation already sent to this user' });
        }

        // Ensure invitee exists in users table
        const inviteeUser = await db.select()
            .from(UsersModel)
            .where(eq(UsersModel.address, inviteeAddress.toLowerCase()))
            .limit(1);

        if (inviteeUser.length === 0) {
            return res.status(404).json({ error: 'Invitee user not found in database' });
        }

        // Create invitation
        const invitation = await db.insert(InvitationModel).values({
            organisationId: parseInt(id),
            inviterAddress: inviterAddress.toLowerCase(),
            inviteeAddress: inviteeAddress.toLowerCase(),
            role: role || 'user',
            status: 'pending'
        }).returning();

        // Create notification for invitee
        await db.insert(NotificationModel).values({
            userId: inviteeUser[0].id,
            userAddress: inviteeAddress.toLowerCase(),
            type: 'invitation',
            title: `Invitation to join ${organisation[0].name}`,
            message: `You have been invited to join ${organisation[0].name}`,
            relatedEntityId: invitation[0].id,
            relatedEntityType: 'invitation',
            read: false
        });

        return res.status(201).json({
            message: 'Invitation sent successfully',
            invitation: invitation[0]
        });
    } catch (error) {
        console.error('Error sending invitation:', error);
        return res.status(500).json({
            error: 'Failed to send invitation',
            details: error.message
        });
    }
}

/**
 * Accept an invitation (requires 20 tokens)
 */
async function acceptInvitation(req, res) {
    try {
        const { id } = req.params; // invitation ID
        const userAddress = req.walletAddress;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Get invitation
        const invitation = await db.select()
            .from(InvitationModel)
            .where(eq(InvitationModel.id, parseInt(id)))
            .limit(1);

        if (invitation.length === 0) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Check if invitation is for this user
        if (invitation[0].inviteeAddress.toLowerCase() !== userAddress.toLowerCase()) {
            return res.status(403).json({ error: 'This invitation is not for you' });
        }

        // Check if invitation is still pending
        if (invitation[0].status !== 'pending') {
            return res.status(400).json({ error: `Invitation has already been ${invitation[0].status}` });
        }
        // Update invitation status
        await db.update(InvitationModel)
            .set({
                status: 'accepted',
                respondedAt: new Date()
            })
            .where(eq(InvitationModel.id, parseInt(id)));

        // Add user as member
        await db.insert(OrganisationMemberModel).values({
            organisationId: invitation[0].organisationId,
            userAddress: userAddress.toLowerCase(),
            role: invitation[0].role
        });

        // Delete notification
        await db.delete(NotificationModel)
            .where(and(
                eq(NotificationModel.relatedEntityId, parseInt(id)),
                eq(NotificationModel.relatedEntityType, 'invitation')
            ));

        return res.status(200).json({
            message: 'Invitation accepted successfully'
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return res.status(500).json({
            error: 'Failed to accept invitation',
            details: error.message
        });
    }
}

/**
 * Reject an invitation (requires 20 tokens)
 */
async function rejectInvitation(req, res) {
    try {
        const { id } = req.params; // invitation ID
        const userAddress = req.walletAddress;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Get invitation
        const invitation = await db.select()
            .from(InvitationModel)
            .where(eq(InvitationModel.id, parseInt(id)))
            .limit(1);

        if (invitation.length === 0) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Check if invitation is for this user
        if (invitation[0].inviteeAddress.toLowerCase() !== userAddress.toLowerCase()) {
            return res.status(403).json({ error: 'This invitation is not for you' });
        }

        // Check if invitation is still pending
        if (invitation[0].status !== 'pending') {
            return res.status(400).json({ error: `Invitation has already been ${invitation[0].status}` });
        }

       // Update invitation status
        await db.update(InvitationModel)
            .set({
                status: 'rejected',
                respondedAt: new Date()
            })
            .where(eq(InvitationModel.id, parseInt(id)));

        // Delete notification
        await db.delete(NotificationModel)
            .where(and(
                eq(NotificationModel.relatedEntityId, parseInt(id)),
                eq(NotificationModel.relatedEntityType, 'invitation')
            ));

        return res.status(200).json({
            message: 'Invitation rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting invitation:', error);
        return res.status(500).json({
            error: 'Failed to reject invitation',
            details: error.message
        });
    }
}

//Gets user invitations

async function getUserInvitations(req, res) {
    try {
        const userAddress = req.walletAddress || req.query.address;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        const invitations = await db.select({
            id: InvitationModel.id,
            organisationId: InvitationModel.organisationId,
            organisationName: OrganisationModel.name,
            inviterAddress: InvitationModel.inviterAddress,
            role: InvitationModel.role,
            status: InvitationModel.status,
            createdAt: InvitationModel.createdAt,
            respondedAt: InvitationModel.respondedAt
        })
            .from(InvitationModel)
            .innerJoin(OrganisationModel, eq(InvitationModel.organisationId, OrganisationModel.id))
            .where(eq(InvitationModel.inviteeAddress, userAddress.toLowerCase()))
            .orderBy(InvitationModel.createdAt);

        return res.status(200).json({ invitations });
    } catch (error) {
        console.error('Error getting user invitations:', error);
        return res.status(500).json({
            error: 'Failed to get invitations',
            details: error.message
        });
    }
}

module.exports = {
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    getUserInvitations
};

