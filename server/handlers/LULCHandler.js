/**
 * LULC (Land Use Land Cover) Classification Handler
 * 
 * Handles HTTP requests for land classification using ISRO Bhuvan LULC 50k data
 */

const { classifyAOI } = require('../utils/BhuvanService');

/**
 * Classifies a geographic area as built-up or non-built-up
 * 
 * Request body:
 * {
 *   "minLat": number,
 *   "maxLat": number,
 *   "minLon": number,
 *   "maxLon": number
 * }
 * 
 * Response:
 * {
 *   "is_built_up": boolean,
 *   "dominant_land_type": string,
 *   "built_up_percentage": number,
 *   "confidence": number,
 *   "data_source": "ISRO Bhuvan LULC 50k"
 * }
 */
async function classifyLandUse(req, res) {
    console.log("=== LULC Classification Request ===");
    try {
        // Step 1: Extract and validate request parameters
        console.log("Step 1: Extracting request body parameters");
        const { minLat, maxLat, minLon, maxLon } = req.body;

        console.log("Coordinates received:", { minLat, maxLat, minLon, maxLon });

        // Validate required fields
        if (minLat === undefined || maxLat === undefined || 
            minLon === undefined || maxLon === undefined) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['minLat', 'maxLat', 'minLon', 'maxLon'],
                received: { minLat, maxLat, minLon, maxLon }
            });
        }

        // Validate coordinate types
        if (typeof minLat !== 'number' || typeof maxLat !== 'number' ||
            typeof minLon !== 'number' || typeof maxLon !== 'number') {
            return res.status(400).json({
                error: 'Invalid coordinate types',
                message: 'All coordinates must be numbers'
            });
        }

        // Validate coordinate ranges
        if (minLat >= maxLat) {
            return res.status(400).json({
                error: 'Invalid latitude range',
                message: `minLat (${minLat}) must be less than maxLat (${maxLat})`
            });
        }

        if (minLon >= maxLon) {
            return res.status(400).json({
                error: 'Invalid longitude range',
                message: `minLon (${minLon}) must be less than maxLon (${maxLon})`
            });
        }

        if (!(-90 <= minLat && minLat <= 90 && -90 <= maxLat && maxLat <= 90)) {
            return res.status(400).json({
                error: 'Invalid latitude',
                message: 'Latitude must be between -90 and 90'
            });
        }

        if (!(-180 <= minLon && minLon <= 180 && -180 <= maxLon && maxLon <= 180)) {
            return res.status(400).json({
                error: 'Invalid longitude',
                message: 'Longitude must be between -180 and 180'
            });
        }

        console.log("Coordinate validation passed");

        // Step 2: Classify AOI using Bhuvan service
        console.log("Step 2: Classifying AOI using ISRO Bhuvan LULC 50k");
        const classification = await classifyAOI(minLat, maxLat, minLon, maxLon);

        console.log("Classification completed:", classification);
        console.log("=== LULC Classification Request Completed Successfully ===");

        // Step 3: Return classification result
        return res.status(200).json(classification);

    } catch (error) {
        console.error("Error in LULC classification:", error);
        console.error("Error stack:", error.stack);

        // Handle specific error types
        if (error.message.includes('Invalid bounding box') || 
            error.message.includes('Coordinates out of valid range')) {
            return res.status(400).json({
                error: 'Invalid input',
                message: error.message
            });
        }

        if (error.message.includes('Bhuvan API error') || 
            error.message.includes('Failed to fetch LULC statistics')) {
            return res.status(502).json({
                error: 'External service error',
                message: error.message
            });
        }

        if (error.message.includes('Invalid API response')) {
            return res.status(502).json({
                error: 'Invalid API response',
                message: error.message
            });
        }

        // Generic error response
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

module.exports = {
    classifyLandUse
};

