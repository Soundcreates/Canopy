const { UsersModel } = require('../models/UserModel');
const { db } = require('../config/db');
const { eq, or, ilike } = require('drizzle-orm');

/**
 * Search users by display name or address
 */
async function searchUsers(req, res) {
    try {
        const { query, limit = 50 } = req.query;

        if (!query || query.length < 1) {
            // Return all users if no query (for default list)
            const users = await db.select({
                address: UsersModel.address,
                displayName: UsersModel.displayName,
                createdAt: UsersModel.createdAt
            })
            .from(UsersModel)
            .limit(parseInt(limit));

            return res.status(200).json({ users });
        }

        // Search by display name or address
        const searchTerm = `%${query}%`;
        const users = await db.select({
            address: UsersModel.address,
            displayName: UsersModel.displayName,
            createdAt: UsersModel.createdAt
        })
        .from(UsersModel)
        .where(or(
            ilike(UsersModel.displayName, searchTerm),
            ilike(UsersModel.address, searchTerm)
        ))
        .limit(parseInt(limit));

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error searching users:', error);
        return res.status(500).json({
            error: 'Failed to search users',
            details: error.message
        });
    }
}

module.exports = {
    searchUsers
};

