const { OrganisationModel, OrganisationMemberModel } = require('../models/OrganisationModel');
const { UsersModel } = require('../models/UserModel');
const { ForestModel } = require('../models/ForestModel');
const { db } = require('../config/db');
const { eq, and, isNull, inArray } = require('drizzle-orm');

/**
 * Create a new organization
 */
async function createOrganisation(req, res) {
    console.log("Creating organisation");
    try {
        const { name, description, startDate, endDate, image, owners, users } = req.body;
        const ownerAddress = req.walletAddress || req.body.address;

        // Validate required fields
        if (!name || !description || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields: name, description, startDate, endDate' });
        }

        if (!ownerAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Ensure the primary owner exists in users table
        const existingUser = await db.select()
            .from(UsersModel)
            .where(eq(UsersModel.address, ownerAddress.toLowerCase()))
            .limit(1);

        if (existingUser.length === 0) {
            await db.insert(UsersModel).values({
                address: ownerAddress.toLowerCase()
            });
            console.log("Primary owner created in users table");
        }

        // Create the organization
        const organisation = await db.insert(OrganisationModel).values({
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            image: image || null,
            owner: ownerAddress.toLowerCase(),
            isActive: true
        }).returning();

        const orgId = organisation[0].id;

        // Add primary owner as a member with 'owner' role
        await db.insert(OrganisationMemberModel).values({
            organisationId: orgId,
            userAddress: ownerAddress.toLowerCase(),
            role: 'owner'
        });

        // Add additional owners if provided
        if (owners && Array.isArray(owners) && owners.length > 0) {
            for (const ownerAddr of owners) {
                const normalizedAddr = ownerAddr.toLowerCase();

                // Ensure user exists
                const userExists = await db.select()
                    .from(UsersModel)
                    .where(eq(UsersModel.address, normalizedAddr))
                    .limit(1);

                if (userExists.length === 0) {
                    await db.insert(UsersModel).values({
                        address: normalizedAddr
                    });
                }

                // Add as owner member
                await db.insert(OrganisationMemberModel).values({
                    organisationId: orgId,
                    userAddress: normalizedAddr,
                    role: 'owner'
                });
            }
        }

        // Add users if provided
        if (users && Array.isArray(users) && users.length > 0) {
            for (const userAddr of users) {
                const normalizedAddr = userAddr.toLowerCase();

                // Ensure user exists
                const userExists = await db.select()
                    .from(UsersModel)
                    .where(eq(UsersModel.address, normalizedAddr))
                    .limit(1);

                if (userExists.length === 0) {
                    await db.insert(UsersModel).values({
                        address: normalizedAddr
                    });
                }

                // Add as regular user member
                await db.insert(OrganisationMemberModel).values({
                    organisationId: orgId,
                    userAddress: normalizedAddr,
                    role: 'user'
                });
            }
        }

        console.log("Organisation created successfully");
        return res.status(201).json({
            message: 'Organisation created successfully',
            organisation: organisation[0]
        });
    } catch (error) {
        console.error("Error creating organisation:", error);
        return res.status(500).json({
            error: 'Failed to create organisation',
            details: error.message
        });
    }
}

/**
 * Get all organizations for the authenticated user
 */
async function getOrganisations(req, res) {
    console.log("Getting organisations");
    try {
        const userAddress = req.walletAddress || req.query.address;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Get organizations where user is owner or member
        const organisations = await db.select({
            id: OrganisationModel.id,
            name: OrganisationModel.name,
            description: OrganisationModel.description,
            startDate: OrganisationModel.startDate,
            endDate: OrganisationModel.endDate,
            image: OrganisationModel.image,
            owner: OrganisationModel.owner,
            isActive: OrganisationModel.isActive,
            createdAt: OrganisationModel.createdAt,
            updatedAt: OrganisationModel.updatedAt,
            role: OrganisationMemberModel.role,
            joinedAt: OrganisationMemberModel.joinedAt
        })
            .from(OrganisationModel)
            .innerJoin(OrganisationMemberModel, eq(OrganisationModel.id, OrganisationMemberModel.organisationId))
            .where(and(
                eq(OrganisationMemberModel.userAddress, userAddress.toLowerCase()),
                isNull(OrganisationMemberModel.leftDate)
            ));

        console.log("Organisations retrieved:", organisations.length);
        return res.status(200).json({ organisations });
    } catch (error) {
        console.error("Error getting organisations:", error);
        return res.status(500).json({
            error: 'Failed to get organisations',
            details: error.message
        });
    }
}

/**
 * Get a specific organization by ID
 * If userAddress is provided, checks membership and returns member details
 * If not provided, returns public organization info only
 */
async function getOrganisationById(req, res) {
    console.log("Getting organisation by ID");
    try {
        const { id } = req.params;
        const userAddress = req.walletAddress || req.query.address;

        // Get organization
        const organisation = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (organisation.length === 0) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        // If user address is provided, check membership and get member details
        if (userAddress) {
            // Check if user is a member
            const member = await db.select()
                .from(OrganisationMemberModel)
                .where(and(
                    eq(OrganisationMemberModel.organisationId, parseInt(id)),
                    eq(OrganisationMemberModel.userAddress, userAddress.toLowerCase()),
                    isNull(OrganisationMemberModel.leftDate)
                ))
                .limit(1);

            // Get all active members (only if user is a member)
            if (member.length > 0) {
                const members = await db.select({
                    userAddress: OrganisationMemberModel.userAddress,
                    role: OrganisationMemberModel.role,
                    joinedAt: OrganisationMemberModel.joinedAt,
                    leftDate: OrganisationMemberModel.leftDate,
                    displayName: UsersModel.displayName,
                })
                    .from(OrganisationMemberModel)
                    .leftJoin(UsersModel, eq(OrganisationMemberModel.userAddress, UsersModel.address))
                    .where(and(
                        eq(OrganisationMemberModel.organisationId, parseInt(id)),
                        isNull(OrganisationMemberModel.leftDate)
                    ));

                // Calculate forest stats for each member
                const memberAddresses = members.map(m => m.userAddress);
                let memberStats = {};

                if (memberAddresses.length > 0) {
                    const forests = await db.select({
                        owner: ForestModel.owner,
                        area: ForestModel.area,
                        totalCarbonCredits: ForestModel.totalCarbonCredits
                    })
                        .from(ForestModel)
                        .where(and(
                            inArray(ForestModel.owner, memberAddresses),
                            eq(ForestModel.isActive, true)
                        ));

                    // Aggregate
                    forests.forEach(f => {
                        if (!memberStats[f.owner]) {
                            memberStats[f.owner] = { forestsRegistered: 0, verifiedArea: 0, totalCarbonCredits: 0 };
                        }
                        memberStats[f.owner].forestsRegistered++;
                        memberStats[f.owner].verifiedArea += Number(f.area);
                        memberStats[f.owner].totalCarbonCredits += (f.totalCarbonCredits || 0);
                    });
                }

                // Merge stats
                const membersWithStats = members.map(m => {
                    const stats = memberStats[m.userAddress] || { forestsRegistered: 0, verifiedArea: 0, totalCarbonCredits: 0 };
                    return {
                        ...m,
                        forestsRegistered: stats.forestsRegistered,
                        verifiedArea: (stats.verifiedArea / 10000), // Convert m2 to ha
                        totalCarbonCredits: stats.totalCarbonCredits
                    };
                });

                return res.status(200).json({
                    organisation: organisation[0],
                    members: membersWithStats,
                    isMember: true
                });
            }
        }

        // Return public organization info (without member details)
        return res.status(200).json({
            organisation: organisation[0],
            members: [],
            isMember: false
        });
    } catch (error) {
        console.error("Error getting organisation by ID:", error);
        return res.status(500).json({
            error: 'Failed to get organisation',
            details: error.message
        });
    }
}

/**
 * Update an organization
 */
async function updateOrganisation(req, res) {
    console.log("Updating organisation");
    try {
        const { id } = req.params;
        const { name, description, startDate, endDate, image, isActive } = req.body;
        const userAddress = req.walletAddress;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Check if user is owner
        const organisation = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (organisation.length === 0) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        // Check if user is an owner
        const member = await db.select()
            .from(OrganisationMemberModel)
            .where(and(
                eq(OrganisationMemberModel.organisationId, parseInt(id)),
                eq(OrganisationMemberModel.userAddress, userAddress.toLowerCase()),
                eq(OrganisationMemberModel.role, 'owner')
            ))
            .limit(1);

        if (member.length === 0 && organisation[0].owner !== userAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Only owners can update the organisation' });
        }

        // Build update object
        const updateData = {
            updatedAt: new Date()
        };
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (image !== undefined) updateData.image = image;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updated = await db.update(OrganisationModel)
            .set(updateData)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .returning();

        console.log("Organisation updated successfully");
        return res.status(200).json({
            message: 'Organisation updated successfully',
            organisation: updated[0]
        });
    } catch (error) {
        console.error("Error updating organisation:", error);
        return res.status(500).json({
            error: 'Failed to update organisation',
            details: error.message
        });
    }
}

/**
 * Add members (owners or users) to an organization
 */
async function addMembers(req, res) {
    console.log("Adding members to organisation");
    try {
        const { id } = req.params;
        const { owners, users } = req.body;
        const userAddress = req.walletAddress;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Check if user is owner
        const organisation = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (organisation.length === 0) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        // Check if user is an owner
        const member = await db.select()
            .from(OrganisationMemberModel)
            .where(and(
                eq(OrganisationMemberModel.organisationId, parseInt(id)),
                eq(OrganisationMemberModel.userAddress, userAddress.toLowerCase()),
                eq(OrganisationMemberModel.role, 'owner')
            ))
            .limit(1);

        if (member.length === 0 && organisation[0].owner !== userAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Only owners can add members' });
        }

        const addedMembers = [];

        // Add owners
        if (owners && Array.isArray(owners) && owners.length > 0) {
            for (const ownerAddr of owners) {
                const normalizedAddr = ownerAddr.toLowerCase();

                // Check if already a member
                const existing = await db.select()
                    .from(OrganisationMemberModel)
                    .where(and(
                        eq(OrganisationMemberModel.organisationId, parseInt(id)),
                        eq(OrganisationMemberModel.userAddress, normalizedAddr)
                    ))
                    .limit(1);

                if (existing.length > 0) {
                    continue; // Skip if already a member
                }

                // Ensure user exists
                const userExists = await db.select()
                    .from(UsersModel)
                    .where(eq(UsersModel.address, normalizedAddr))
                    .limit(1);

                if (userExists.length === 0) {
                    await db.insert(UsersModel).values({
                        address: normalizedAddr
                    });
                }

                // Add as owner member
                const newMember = await db.insert(OrganisationMemberModel).values({
                    organisationId: parseInt(id),
                    userAddress: normalizedAddr,
                    role: 'owner'
                }).returning();

                addedMembers.push(newMember[0]);
            }
        }

        // Add users
        if (users && Array.isArray(users) && users.length > 0) {
            for (const userAddr of users) {
                const normalizedAddr = userAddr.toLowerCase();

                // Check if already a member
                const existing = await db.select()
                    .from(OrganisationMemberModel)
                    .where(and(
                        eq(OrganisationMemberModel.organisationId, parseInt(id)),
                        eq(OrganisationMemberModel.userAddress, normalizedAddr)
                    ))
                    .limit(1);

                if (existing.length > 0) {
                    continue; // Skip if already a member
                }

                // Ensure user exists
                const userExists = await db.select()
                    .from(UsersModel)
                    .where(eq(UsersModel.address, normalizedAddr))
                    .limit(1);

                if (userExists.length === 0) {
                    await db.insert(UsersModel).values({
                        address: normalizedAddr
                    });
                }

                // Add as regular user member
                const newMember = await db.insert(OrganisationMemberModel).values({
                    organisationId: parseInt(id),
                    userAddress: normalizedAddr,
                    role: 'user'
                }).returning();

                addedMembers.push(newMember[0]);
            }
        }

        console.log("Members added successfully");
        return res.status(200).json({
            message: 'Members added successfully',
            addedMembers
        });
    } catch (error) {
        console.error("Error adding members:", error);
        return res.status(500).json({
            error: 'Failed to add members',
            details: error.message
        });
    }
}

/**
 * Remove a member from an organization
 */
async function removeMember(req, res) {
    console.log("Removing member from organisation");
    try {
        const { id, memberAddress } = req.params;
        const userAddress = req.walletAddress;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Check if user is owner
        const organisation = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (organisation.length === 0) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        // Check if user is an owner
        const member = await db.select()
            .from(OrganisationMemberModel)
            .where(and(
                eq(OrganisationMemberModel.organisationId, parseInt(id)),
                eq(OrganisationMemberModel.userAddress, userAddress.toLowerCase()),
                eq(OrganisationMemberModel.role, 'owner')
            ))
            .limit(1);

        if (member.length === 0 && organisation[0].owner !== userAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Only owners can remove members' });
        }

        // Cannot remove the primary owner
        if (memberAddress.toLowerCase() === organisation[0].owner.toLowerCase()) {
            return res.status(400).json({ error: 'Cannot remove the primary owner' });
        }

        // Update member's leftDate instead of deleting
        const updated = await db.update(OrganisationMemberModel)
            .set({ leftDate: new Date() })
            .where(and(
                eq(OrganisationMemberModel.organisationId, parseInt(id)),
                eq(OrganisationMemberModel.userAddress, memberAddress.toLowerCase())
            ))
            .returning();

        if (updated.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }

        console.log("Member removed successfully");
        return res.status(200).json({
            message: 'Member removed successfully',
            member: updated[0]
        });
    } catch (error) {
        console.error("Error removing member:", error);
        return res.status(500).json({
            error: 'Failed to remove member',
            details: error.message
        });
    }
}

/**
 * Delete an organization (soft delete by setting isActive to false)
 */
async function deleteOrganisation(req, res) {
    console.log("Deleting organisation");
    try {
        const { id } = req.params;
        const userAddress = req.walletAddress;

        if (!userAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Check if user is primary owner
        const organisation = await db.select()
            .from(OrganisationModel)
            .where(eq(OrganisationModel.id, parseInt(id)))
            .limit(1);

        if (organisation.length === 0) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        if (organisation[0].owner.toLowerCase() !== userAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Only the primary owner can delete the organisation' });
        }

        // Soft delete by setting isActive to false
        const updated = await db.update(OrganisationModel)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(OrganisationModel.id, parseInt(id)))
            .returning();

        console.log("Organisation deleted successfully");
        return res.status(200).json({
            message: 'Organisation deleted successfully',
            organisation: updated[0]
        });
    } catch (error) {
        console.error("Error deleting organisation:", error);
        return res.status(500).json({
            error: 'Failed to delete organisation',
            details: error.message
        });
    }
}

/**
 * Get all organizations for marketplace (public endpoint)
 * Returns all active organizations with member counts and progress
 */
async function getMarketplaceOrganisations(req, res) {
    console.log("Getting marketplace organisations");
    try {
        // Get all active organizations
        const organisations = await db.select({
            id: OrganisationModel.id,
            name: OrganisationModel.name,
            description: OrganisationModel.description,
            startDate: OrganisationModel.startDate,
            endDate: OrganisationModel.endDate,
            image: OrganisationModel.image,
            owner: OrganisationModel.owner,
            isActive: OrganisationModel.isActive,
            createdAt: OrganisationModel.createdAt,
        })
            .from(OrganisationModel)
            .where(eq(OrganisationModel.isActive, true));

        // Get member counts for each organization
        const organisationsWithMembers = await Promise.all(
            organisations.map(async (org) => {
                // Count active members (where leftDate is null)
                const members = await db.select()
                    .from(OrganisationMemberModel)
                    .where(
                        and(
                            eq(OrganisationMemberModel.organisationId, org.id),
                            isNull(OrganisationMemberModel.leftDate)
                        )
                    );

                const memberCount = members.length;

                // Calculate progress based on dates
                const now = new Date();
                const startDate = new Date(org.startDate);
                const endDate = new Date(org.endDate);
                const totalDuration = endDate - startDate;
                const elapsed = now - startDate;

                let progress = 0;
                if (totalDuration > 0) {
                    progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
                }

                // Format dates for display
                const formatDate = (date) => {
                    return new Date(date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                };

                return {
                    id: org.id,
                    name: org.name,
                    description: org.description,
                    members: memberCount,
                    progress: progress,
                    startDate: formatDate(org.startDate),
                    endDate: formatDate(org.endDate),
                    image: org.image,
                    owner: org.owner,
                    createdAt: org.createdAt
                };
            })
        );

        console.log("Marketplace organisations retrieved:", organisationsWithMembers.length);
        return res.status(200).json({ organisations: organisationsWithMembers });
    } catch (error) {
        console.error("Error getting marketplace organisations:", error);
        return res.status(500).json({
            error: 'Failed to get marketplace organisations',
            details: error.message
        });
    }
}

module.exports = {
    createOrganisation,
    getOrganisations,
    getOrganisationById,
    updateOrganisation,
    addMembers,
    removeMember,
    deleteOrganisation,
    getMarketplaceOrganisations
};

