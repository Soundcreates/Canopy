const { db } = require("../config/db");
const { RegistrationsSessionsModel } = require("../models/RegistrationsSessionsModel");
const { eq, and } = require("drizzle-orm");
const { v4: uuidv4 } = require("uuid");

//Creates a registration session for org (only by owner)
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

        // Deactivate any existing active sessions for this organisation
        await db.update(RegistrationsSessionsModel)
            .set({ isActive: false, endedAt: new Date() })
            .where(and(
                eq(RegistrationsSessionsModel.organisationId, organisationId),
                eq(RegistrationsSessionsModel.isActive, true)
            ));

        // Generate unique session ID
        const sessionId = Date.now(); // Using timestamp as session ID

        // Create session in database
        const session = await db.insert(RegistrationsSessionsModel).values({
            sessionId: sessionId,
            organisationId: organisationId,
            owner: owner.toLowerCase(),
            users: [], // Initialize with empty array
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

//joinSession (for members)
async function joinSession(req, res) {
    const { sessionId } = req.params;
    console.log("Joining Session: ", sessionId);

    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({
                error: "Address is required"
            });
        }

        //  Fetch existing session
        const existingSession = await db.select()
            .from(RegistrationsSessionsModel)
            .where(eq(RegistrationsSessionsModel.sessionId, parseInt(sessionId))) // Ensure numeric ID comparison
            .limit(1);

        if (existingSession.length === 0) {
            console.log("There's no such session Id ongoing");
            return res.status(404).json({
                error: "Session not found"
            });
        }

        const currentUsers = existingSession[0].users || [];

        // Check if user already joined to avoid duplicates
        if (!currentUsers.includes(address)) {
            const updatedUsers = [...currentUsers, address];

            // Update users array
            await db.update(RegistrationsSessionsModel)
                .set({ users: updatedUsers })
                .where(eq(RegistrationsSessionsModel.sessionId, parseInt(sessionId)));

            console.log(`User ${address} joined session ${sessionId}`);
        } else {
            console.log(`User ${address} already in session ${sessionId}`);
        }

        return res.status(200).json({
            success: true,
            message: "Joined session successfully"
        });

    } catch (error) {
        console.error("Error joining registration session:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
}

//Gets session by id
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

//gets active session for the org whos id is provided
async function getActiveSessionForOrg(req, res) {
    console.log("Getting active registration session for org");
    try {
        const { orgId } = req.params;

        if (!orgId) {
            return res.status(400).json({
                error: "Organisation ID is required"
            });
        }

        const session = await db.select()
            .from(RegistrationsSessionsModel)
            .where(and(
                eq(RegistrationsSessionsModel.organisationId, parseInt(orgId)),
                eq(RegistrationsSessionsModel.isActive, true)
            ))
            .limit(1);

        if (session.length === 0) {
            // Not found is not an error here, just means no active session
            return res.status(200).json({
                success: true,
                session: null
            });
        }

        return res.status(200).json({
            success: true,
            session: session[0]
        });
    } catch (error) {
        console.error("Error getting active registration session:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message
        });
    }
}


//ends a session
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
    getActiveSessionForOrg,
    endSession,
    joinSession
};
