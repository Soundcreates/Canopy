const { ForestModel } = require('../models/ForestModel');
const { db } = require('../config/db');
const { eq } = require('drizzle-orm');
const CarbonCreditNFTContext = require('../contexts/CarbonCreditNFTContext');
const { uploadImageToIPFS, uploadMetadataToIPFS, getImageFromIPFS } = require('../utils/PinataUtil');
const { classifyAOI } = require('../utils/BhuvanService');

async function getNDVI(req, res) {
    console.log("=== NDVI Pipeline Started ===");
    try {
        // Get Python backend URL from environment variable
        // Hardcode fallback for testing if env var isn't picked up
        const pythonUrl = process.env.PYTHON_URL || 'http://localhost:8000';

        // Step 1: Extract and validate request parameters
        console.log("Step 1: Extracting request body parameters");
        const {
            forest_id,
            min_lon,
            max_lon,
            min_lat,
            max_lat,
            epoch_start,
            epoch_end,
            carbon_tons,
            area_hectares,
            status = "ACTIVE"
        } = req.body;

        console.log("Forest ID: ", forest_id);
        console.log("Coordinates: ", { min_lon, max_lon, min_lat, max_lat });

        // Validate required fields first (before making API calls)
        if (!forest_id || min_lon === undefined || max_lon === undefined ||
            min_lat === undefined || max_lat === undefined) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['forest_id', 'min_lon', 'max_lon', 'min_lat', 'max_lat']
            });
        }

        // Get forest from database
        console.log("Step 1.5: Fetching forest from database");
        const forests = await db.select()
            .from(ForestModel)
            .where(eq(ForestModel.forestId, forest_id))
            .limit(1);

        if (forests.length === 0) {
            return res.status(404).json({ error: 'Forest not found' });
        }

        const forest = forests[0];
        console.log("Forest found: ", forest.owner);

        // Validate coordinates on Node.js side as well
        if (min_lon >= max_lon) {
            console.log("Validation failed: min_lon must be less than max_lon");
            return res.status(400).json({
                error: 'Invalid longitude range',
                message: `min_lon (${min_lon}) must be less than max_lon (${max_lon})`
            });
        }

        if (min_lat >= max_lat) {
            console.log("Validation failed: min_lat must be less than max_lat");
            return res.status(400).json({
                error: 'Invalid latitude range',
                message: `min_lat (${min_lat}) must be less than max_lat (${max_lat})`
            });
        }

        if (!(-180 <= min_lon && min_lon <= 180 && -180 <= max_lon && max_lon <= 180)) {
            console.log("Validation failed: longitude out of valid range");
            return res.status(400).json({
                error: 'Invalid longitude',
                message: 'Longitude must be between -180 and 180'
            });
        }

        if (!(-90 <= min_lat && min_lat <= 90 && -90 <= max_lat && max_lat <= 90)) {
            console.log("Validation failed: latitude out of valid range");
            return res.status(400).json({
                error: 'Invalid latitude',
                message: 'Latitude must be between -90 and 90'
            });
        }

        console.log("Coordinate validation passed");

        // Step 0: Check if the area is built-up using LULC classification
        // This check happens before NDVI computation to avoid processing built-up areas
        console.log("Step 0: Checking land classification (built-up vs non-built-up)");
        try {
            const lulcClassification = await classifyAOI(min_lat, max_lat, min_lon, max_lon);
            console.log("LULC Classification result:", lulcClassification);

            if (lulcClassification.is_built_up) {
                console.log("Area is classified as built-up. Stopping NDVI pipeline.");
                return res.status(400).json({
                    error: 'Area is built-up',
                    message: 'Cannot process NDVI for built-up areas. Only forest/agriculture/plain land is allowed.',
                    lulc_data: {
                        is_built_up: lulcClassification.is_built_up,
                        dominant_land_type: lulcClassification.dominant_land_type,
                        built_up_percentage: lulcClassification.built_up_percentage,
                        confidence: lulcClassification.confidence
                    }
                });
            }
            console.log("Area is non-built-up. Proceeding with NDVI pipeline.");
        } catch (lulcError) {
            console.error("Error during LULC classification:", lulcError);
            // If LULC check fails, we can either:
            // Option 1: Fail the request (strict) - uncomment to enable
            // return res.status(502).json({ 
            //     error: 'LULC classification service unavailable',
            //     message: lulcError.message 
            // });

            // Option 2: Log warning but continue (lenient - for development)
            console.warn("LULC classification failed, but continuing with NDVI pipeline:", lulcError.message);
        }

        // Step 2: Fetch satellite data and compute NDVI
        console.log("Step 2: Computing NDVI from satellite data");
        const ndviEndpoint = `${pythonUrl}/ndvi`;
        console.log(`Sending POST request to ${ndviEndpoint}`);
        const ndviController = new AbortController();
        const ndviTimeout = setTimeout(() => ndviController.abort(), 300000); // 5 minutes timeout

        let ndviResponse;
        try {
            ndviResponse = await fetch(ndviEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ forest_id, min_lon, max_lon, min_lat, max_lat }),
                signal: ndviController.signal
            });
            clearTimeout(ndviTimeout);
        } catch (error) {
            clearTimeout(ndviTimeout);
            if (error.name === 'AbortError') {
                console.error("NDVI computation request timed out after 5 minutes");
                return res.status(504).json({
                    error: 'NDVI computation timeout',
                    message: 'The NDVI computation took too long. Please try again.'
                });
            }
            console.error("Network error during NDVI computation:", error.message);
            return res.status(503).json({
                error: 'Service unavailable',
                message: `Failed to connect to NDVI service: ${error.message}`
            });
        }

        if (!ndviResponse.ok) {
            const errorText = await ndviResponse.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { detail: errorText };
            }
            console.error("NDVI computation failed:", errorData);
            return res.status(ndviResponse.status).json({
                error: 'Failed to compute NDVI',
                message: errorData.detail || errorData.message || 'Unknown error from NDVI service',
                details: errorData
            });
        }

        console.log("Parsing response JSON from Python backend");
        let ndviData;
        try {
            const responseText = await ndviResponse.text();
            ndviData = JSON.parse(responseText);
        } catch (error) {
            console.error("Failed to parse NDVI response JSON:", error);
            return res.status(500).json({
                error: 'Invalid response from NDVI service',
                message: 'The NDVI service returned invalid JSON'
            });
        }

        console.log("NDVI data received:", JSON.stringify(ndviData, null, 2));
        console.log("Extracting NDVI and confidence values");

        // Validate response structure
        if (!ndviData.ndvi && ndviData.ndvi !== 0) {
            console.error("NDVI value missing or invalid in response:", ndviData);
            return res.status(500).json({
                error: 'Invalid NDVI response',
                message: 'The NDVI service did not return a valid NDVI value'
            });
        }

        const { ndvi, confidence, min_lon: returned_min_lon, max_lon: returned_max_lon, min_lat: returned_min_lat, max_lat: returned_max_lat } = ndviData;
        console.log("NDVI value:", ndvi);
        console.log("Confidence value:", confidence);
        console.log("Returned coordinates - Min Lon:", returned_min_lon, "Max Lon:", returned_max_lon, "Min Lat:", returned_min_lat, "Max Lat:", returned_max_lat);


        // Step 3: Persist verification record
        console.log("Step 3: Persisting verification record");
        const currentDate = new Date();
        await db.update(ForestModel)
            .set({
                lastVerificationDate: currentDate,
                lastNDVI: ndvi.toString(),
                lastConfidence: confidence.toString(),
                updatedAt: currentDate
            })
            .where(eq(ForestModel.forestId, forest_id));
        console.log("Verification record persisted");

        // Step 4: Generate NFT graph image
        console.log("Step 4: Generating NFT graph image");
        // Calculate time period (use epoch dates if provided, otherwise default to 30 days)
        let timePeriod = 30; // Default to 30 days
        if (epoch_start && epoch_end) {
            const startDate = new Date(epoch_start);
            const endDate = new Date(epoch_end);
            timePeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)); // Days difference
        }

        const graphRequest = {
            forest_id,
            ndvi_delta: parseFloat(ndvi) || 0.5, // Use computed NDVI as delta
            time: timePeriod.toString() // Time period in days
        };

        console.log("Graph request payload:", graphRequest);
        const graphEndpoint = `${pythonUrl}/generate-nft-graph`;
        console.log(`Sending POST request to ${graphEndpoint}`);
        const imageController = new AbortController();
        const imageTimeout = setTimeout(() => imageController.abort(), 60000); // 1 minute timeout

        let imageResponse;
        try {
            imageResponse = await fetch(graphEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(graphRequest),
                signal: imageController.signal
            });
            clearTimeout(imageTimeout);
        } catch (error) {
            clearTimeout(imageTimeout);
            if (error.name === 'AbortError') {
                console.error("Image generation request timed out after 1 minute");
                return res.status(504).json({
                    error: 'Image generation timeout',
                    message: 'The image generation took too long. Please try again.'
                });
            }
            throw error;
        }

        if (!imageResponse.ok) {
            const errorText = await imageResponse.text();
            console.error("Image generation failed:", errorText);
            return res.status(imageResponse.status).json({
                error: 'Failed to generate NFT image',
                details: errorText
            });
        }

        // Image endpoint returns binary PNG data
        console.log("Converting image response to ArrayBuffer");
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        console.log("ArrayBuffer received, size:", imageArrayBuffer.byteLength, "bytes");
        console.log("Converting ArrayBuffer to Buffer");
        const imageBuffer = Buffer.from(imageArrayBuffer);
        console.log("Buffer created, size:", imageBuffer.length, "bytes");

        console.log("NFT graph image generated successfully");
        console.log("Image buffer size:", imageBuffer.length, "bytes");

        // Step 5: Upload image + metadata
        console.log("Step 5: Uploading image and metadata to IPFS");
        console.log("Preparing image filename for IPFS upload");
        const imageFileName = `forest-${forest_id}-nft-${Date.now()}.png`;
        console.log("Image filename:", imageFileName);
        console.log("Calling uploadImageToIPFS function");
        const imageUri = await uploadImageToIPFS(imageBuffer, imageFileName);
        console.log("Image uploaded to IPFS");
        console.log("Image URI:", imageUri);

        // Create metadata JSON
        console.log("Creating metadata JSON object");
        console.log("Metadata name: Carbon Credit #" + forest_id);
        const metadata = {
            name: `Carbon Credit #${forest_id}`,
            description: `Carbon credit NFT for forest ${forest_id}. Verified on ${currentDate.toISOString()}.`,
            image: imageUri,
            attributes: [
                { trait_type: "Forest ID", value: forest_id },
                { trait_type: "NDVI", value: parseFloat(ndvi) },
                { trait_type: "Confidence", value: parseFloat(confidence) },
                { trait_type: "Carbon Tons", value: carbon_tons || 0 },
                { trait_type: "Area Hectares", value: area_hectares || forest.area / 10000 },
                { trait_type: "Status", value: status },
                { trait_type: "Verification Date", value: currentDate.toISOString() }
            ],
            properties: {
                forest_id,
                owner: forest.owner,
                verification_date: currentDate.toISOString()
            }
        };
        console.log("Metadata object created");
        console.log("Metadata attributes count:", metadata.attributes.length);
        console.log("Metadata properties:", JSON.stringify(metadata.properties, null, 2));

        console.log("Preparing metadata for IPFS upload");
        console.log("Calling uploadMetadataToIPFS function");
        const metadataUri = await uploadMetadataToIPFS(metadata, `forest-${forest_id}-metadata-${Date.now()}.json`);
        console.log("Metadata uploaded to IPFS");
        console.log("Metadata URI:", metadataUri);

        // Step 6: Mint Carbon Credit NFT
        console.log("Step 6: Minting Carbon Credit NFT");
        console.log("Creating CarbonCreditNFTContext instance");
        console.log("RPC URL:", process.env.RPC_URL ? "Set" : "Not set");
        console.log("Owner Private Key:", process.env.OWNER_PRIVATE_KEY ? "Set" : "Not set");
        console.log("Note: mintCredit requires contract owner, not oracle");

        // Use OWNER_PRIVATE_KEY for minting (mintCredit has onlyOwner modifier)
        // If OWNER_PRIVATE_KEY is not set, fall back to ORACLE_PRIVATE_KEY for backward compatibility
        const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY || process.env.ORACLE_PRIVATE_KEY;
        if (!ownerPrivateKey) {
            console.log("Error: Neither OWNER_PRIVATE_KEY nor ORACLE_PRIVATE_KEY is set");
            throw new Error('OWNER_PRIVATE_KEY or ORACLE_PRIVATE_KEY is required for minting');
        }

        const nftContext = new CarbonCreditNFTContext(
            process.env.RPC_URL,
            ownerPrivateKey
        );
        console.log("CarbonCreditNFTContext instance created");

        console.log("Preparing mintCredit parameters");
        console.log("Recipient address (forest owner):", forest.owner);
        console.log("Forest ID:", forest_id);
        console.log("Metadata URI:", metadataUri);
        console.log("Calling mintCredit function");
        const mintResult = await nftContext.mintCredit(
            forest.owner, // Mint to forest owner
            forest_id,
            metadataUri
        );
        console.log("mintCredit function completed");
        console.log("Mint result received:", JSON.stringify(mintResult, null, 2));
        console.log("Extracting tokenId from mint result");
        const { tokenId } = mintResult;
        console.log("Token ID extracted:", tokenId);

        // Step 7: Persist NFT record
        console.log("Step 7: Persisting NFT record");
        console.log("Preparing update data");
        const currentTotalCredits = forest.totalCarbonCredits || 0;
        console.log("Current total carbon credits:", currentTotalCredits);
        const newTotalCredits = currentTotalCredits + 1;
        console.log("New total carbon credits:", newTotalCredits);
        const updateData = {
            latestTokenId: tokenId,
            latestMetadataUri: metadataUri,
            totalCarbonCredits: newTotalCredits,
            updatedAt: new Date()
        };
        console.log("Update data prepared:", JSON.stringify(updateData, null, 2));
        console.log("Executing database update");
        await db.update(ForestModel)
            .set(updateData)
            .where(eq(ForestModel.forestId, forest_id));
        console.log("Database update executed");
        console.log("NFT record persisted successfully");

        // Step 8: Update forest state (if needed)
        console.log("Step 8: Updating forest state");
        // Forest state is already updated with verification and NFT data above
        // You can add additional state updates here if needed
        console.log("Forest state updated");

        console.log("=== NDVI Pipeline Completed Successfully ===");
        return res.status(200).json({
            success: true,
            message: 'NDVI computed and NFT minted successfully',
            data: {
                ndvi,
                confidence,
                tokenId,
                metadataUri,
                imageUri,
                forestId: forest_id
            }
        });

    } catch (error) {
        console.error("Error in NDVI pipeline:", error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

async function getImageFromIPFSHandler(req, res) {
    console.log("Image fetch request received");
    try {
        console.log("Extracting IPFS hash/URI from request");
        const { ipfsHash } = req.query;

        if (!ipfsHash) {
            console.log("IPFS hash not provided in query parameters");
            return res.status(400).json({
                error: 'IPFS hash is required',
                required: 'ipfsHash query parameter'
            });
        }
        console.log("IPFS hash/URI:", ipfsHash);

        console.log("Fetching image from IPFS");
        const imageBuffer = await getImageFromIPFS(ipfsHash);
        console.log("Image fetched successfully");
        console.log("Image buffer size:", imageBuffer.length, "bytes");

        console.log("Setting response headers for image");
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', imageBuffer.length);
        console.log("Sending image buffer as response");
        res.send(imageBuffer);
        console.log("Image sent successfully");
    } catch (error) {
        console.error("Error fetching image from IPFS:", error);
        console.error("Error message:", error.message);
        return res.status(500).json({
            error: 'Failed to fetch image from IPFS',
            details: error.message
        });
    }
}

module.exports = { getNDVI, getImageFromIPFSHandler };