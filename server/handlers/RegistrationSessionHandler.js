const { db } = require("../config/db");
const { RegistrationsSessionsModel } = require("../models/RegistrationsSessionsModel");
const { eq, and } = require("drizzle-orm");
const { v4: uuidv4 } = require("uuid");

/**
 * Create a new registration session
 */
async function createSession(req, res) {
    console.log("Creating registration session");
    try {
        const { organisationId } = req.body;
        const owner = req.walletAddress;

        if (!organisationId || !owner) {
            return res.status(400).json({
                error: "Missing required fields",
                message: "organisationId and owner are required"
            });
        }

        // Generate unique session ID
        const sessionId = Date.now(); // Using timestamp as session ID

        // Create session in database
        const session = await db.insert(RegistrationsSessionsModel).values({
            sessionId: sessionId,
            organisationId: organisationId,
            owner: owner.toLowerCase(),
            isActive: true,
            endedAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        }).returning();

        console.log("Registration session created:", session[0].id);

        return res.status(201).json({
            success: true,
            session: session[0]
        });
    } catch (error) {
        console.error("Error creating registration session:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
}

/**
 * Get session details
 */
async function getSession(req, res) {
    console.log("Getting registration session");
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                error: "Session ID is required"
            });
        }

        const session = await db.select()
            .from(RegistrationsSessionsModel)
            .where(eq(RegistrationsSessionsModel.sessionId, parseInt(sessionId)))
            .limit(1);

        if (session.length === 0) {
            return res.status(404).json({
                error: "Session not found"
            });
        }

        return res.status(200).json({
            success: true,
            session: session[0]
        });
    } catch (error) {
        console.error("Error getting registration session:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
}

/**
 * End/close a session
 */
async function endSession(req, res) {
    console.log("Ending registration session");
    try {
        const { sessionId } = req.params;
        const owner = req.walletAddress;

        if (!sessionId || !owner) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

        const session = await db.select()
            .from(RegistrationsSessionsModel)
            .where(eq(RegistrationsSessionsModel.sessionId, parseInt(sessionId)))
            .limit(1);

        if (session.length === 0) {
            return res.status(404).json({
                error: "Session not found"
            });
        }

        // Verify owner
        if (session[0].owner.toLowerCase() !== owner.toLowerCase()) {
            return res.status(403).json({
                error: "Unauthorized",
                message: "Only the session owner can end the session"
            });
        }

        // Update session
        const updated = await db.update(RegistrationsSessionsModel)
            .set({
                isActive: false,
                endedAt: new Date()
            })
            .where(eq(RegistrationsSessionsModel.sessionId, parseInt(sessionId)))
            .returning();

        return res.status(200).json({
            success: true,
            session: updated[0]
        });
    } catch (error) {
        console.error("Error ending registration session:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
}

module.exports = {
    createSession,
    getSession,
    endSession
};

