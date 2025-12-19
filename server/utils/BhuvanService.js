/**
 * ISRO Bhuvan LULC 50k AOI-wise Service
 * 
 * This module provides functionality to:
 * - Convert bounding boxes to GeoJSON polygons
 * - Submit AOI requests to ISRO Bhuvan LULC 50k API
 * - Parse LULC statistics
 * - Classify land as built-up or non-built-up
 */

/**
 * Creates a GeoJSON polygon from a bounding box
 * @param {number} minLat - Minimum latitude
 * @param {number} maxLat - Maximum latitude
 * @param {number} minLon - Minimum longitude
 * @param {number} maxLon - Maximum longitude
 * @returns {Object} GeoJSON Polygon object (EPSG:4326)
 */
function createGeoJSONPolygon(minLat, maxLat, minLon, maxLon) {
    // Validate input coordinates
    if (minLat >= maxLat || minLon >= maxLon) {
        throw new Error('Invalid bounding box: min values must be less than max values');
    }
    
    if (minLat < -90 || maxLat > 90 || minLon < -180 || maxLon > 180) {
        throw new Error('Coordinates out of valid range: lat must be [-90, 90], lon must be [-180, 180]');
    }

    // Create polygon coordinates in [longitude, latitude] format
    // Polygon must be closed (first point equals last point)
    const coordinates = [
        [minLon, minLat],  // Bottom-left
        [minLon, maxLat],  // Top-left
        [maxLon, maxLat],  // Top-right
        [maxLon, minLat],  // Bottom-right
        [minLon, minLat]   // Close polygon (same as first point)
    ];

    return {
        type: "Polygon",
        coordinates: [coordinates],
        crs: {
            type: "name",
            properties: {
                name: "EPSG:4326"
            }
        }
    };
}

/**
 * Submits an AOI request to ISRO Bhuvan LULC 50k API
 * @param {Object} geojsonPolygon - GeoJSON polygon object
 * @returns {Promise<Object>} API response containing LULC statistics
 */
async function fetchLULCStatistics(geojsonPolygon) {
    // Bhuvan LULC 50k AOI-wise API endpoint
    // Note: Actual endpoint may vary - adjust based on official documentation
    const apiUrl = process.env.BHUVAN_API_URL || 'https://bhuvan-app1.nrsc.gov.in/api/lulc50k/aoi-wise';
    
    // Prepare request payload
    const requestPayload = {
        dataset: "LULC 50k",
        year: "latest", // Use latest available year
        aoi: geojsonPolygon,
        output_format: "statistics", // Request statistics only, no images
        include_percentage: true,
        include_area: true
    };

    // Prepare headers
    const headers = {
        'Content-Type': 'application/json'
    };

    // Add authentication if available
    if (process.env.BHUVAN_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.BHUVAN_API_KEY}`;
    } else if (process.env.BHUVAN_API_TOKEN) {
        headers['X-API-Token'] = process.env.BHUVAN_API_TOKEN;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestPayload)
        });

        // Get response text first to check content type
        const responseText = await response.text();
        
        if (!response.ok) {
            throw new Error(`Bhuvan API error (${response.status}): ${responseText.substring(0, 200)}`);
        }

        // Check if response is empty
        if (!responseText || responseText.trim().length === 0) {
            throw new Error('Bhuvan API returned empty response');
        }

        // Try to parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            // If JSON parsing fails, provide helpful error message
            console.error('Failed to parse JSON response from Bhuvan API');
            console.error('Response content type:', response.headers.get('content-type'));
            console.error('Response preview:', responseText.substring(0, 500));
            throw new Error(`Bhuvan API returned invalid JSON. Response preview: ${responseText.substring(0, 200)}`);
        }

        return data;
    } catch (error) {
        if (error.message.includes('Bhuvan API error') || 
            error.message.includes('Bhuvan API returned')) {
            throw error;
        }
        throw new Error(`Failed to fetch LULC statistics: ${error.message}`);
    }
}

/**
 * Parses LULC statistics from API response
 * @param {Object} apiResponse - Raw API response
 * @returns {Object} Parsed statistics with built-up percentage, dominant land type, and total area
 */
function parseLULCStatistics(apiResponse) {
    // Handle different possible response structures
    let statistics = apiResponse;
    
    // If response has nested data structure
    if (apiResponse.data) {
        statistics = apiResponse.data;
    }
    
    // If response has statistics field
    if (apiResponse.statistics) {
        statistics = apiResponse.statistics;
    }

    // Extract land class data
    // Expected structure: { land_classes: [{ name, percentage, area }, ...], total_area: number }
    const landClasses = statistics.land_classes || statistics.landClasses || statistics.classes || [];
    const totalArea = statistics.total_area || statistics.totalArea || statistics.area || 0;

    if (!Array.isArray(landClasses) || landClasses.length === 0) {
        throw new Error('Invalid API response: land classes data not found or empty');
    }

    // Find built-up percentage and dominant land class
    let builtUpPercentage = 0;
    let dominantLandType = null;
    let maxPercentage = 0;

    // Common built-up land class names (case-insensitive matching)
    const builtUpNames = ['built-up', 'builtup', 'built_up', 'urban', 'settlement', 'residential', 'commercial'];

    for (const landClass of landClasses) {
        const name = (landClass.name || landClass.class || landClass.type || '').toLowerCase().trim();
        const percentage = parseFloat(landClass.percentage || landClass.percent || 0);
        const area = parseFloat(landClass.area || 0);

        // Check if this is a built-up class
        if (builtUpNames.some(builtUpName => name.includes(builtUpName))) {
            builtUpPercentage += percentage; // Sum all built-up related classes
        }

        // Track dominant land class
        if (percentage > maxPercentage) {
            maxPercentage = percentage;
            dominantLandType = landClass.name || landClass.class || landClass.type || 'Unknown';
        }
    }

    // If no built-up found but we have percentage data, try alternative extraction
    if (builtUpPercentage === 0) {
        // Try to find by class code (common LULC codes: 1-10, where built-up is often 1 or 2)
        for (const landClass of landClasses) {
            const code = landClass.code || landClass.class_code || landClass.id;
            if (code === 1 || code === 2 || code === '1' || code === '2') {
                builtUpPercentage = parseFloat(landClass.percentage || landClass.percent || 0);
                break;
            }
        }
    }

    return {
        builtUpPercentage: Math.round(builtUpPercentage * 100) / 100, // Round to 2 decimal places
        dominantLandType: dominantLandType || 'Unknown',
        totalArea: totalArea
    };
}

function classifyLand(builtUpPercentage, dominantLandType) {
    // Decision threshold: > 10% built-up classifies as built-up
    const isBuiltUp = builtUpPercentage > 10;

    // Calculate confidence based on dominant land class percentage
    // Higher percentage of dominant class = higher confidence
    // For built-up classification, confidence is based on built-up percentage
    // For non-built-up, confidence is based on how low the built-up percentage is
    let confidence;
    if (isBuiltUp) {
        // Confidence increases with built-up percentage (capped at 95% for safety)
        confidence = Math.min(95, Math.max(50, builtUpPercentage));
    } else {
        // Confidence increases as built-up percentage decreases
        // If built-up is 0%, confidence is high (90%)
        // If built-up is 10%, confidence is lower (60%)
        confidence = Math.max(60, 90 - (builtUpPercentage * 3));
    }

    return {
        is_built_up: isBuiltUp,
        dominant_land_type: dominantLandType,
        built_up_percentage: builtUpPercentage,
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
        data_source: "ISRO Bhuvan LULC 50k"
    };
}

/**
 * Main function to process AOI and return classification
 * @param {number} minLat - Minimum latitude
 * @param {number} maxLat - Maximum latitude
 * @param {number} minLon - Minimum longitude
 * @param {number} maxLon - Maximum longitude
 * @returns {Promise<Object>} Classification result
 */
async function classifyAOI(minLat, maxLat, minLon, maxLon) {
    try {
        // Step 1: Create GeoJSON polygon
        const geojsonPolygon = createGeoJSONPolygon(minLat, maxLat, minLon, maxLon);

        // Step 2: Fetch LULC statistics from Bhuvan API
        const apiResponse = await fetchLULCStatistics(geojsonPolygon);

        // Step 3: Parse statistics
        const { builtUpPercentage, dominantLandType, totalArea } = parseLULCStatistics(apiResponse);

        // Step 4: Classify land
        const classification = classifyLand(builtUpPercentage, dominantLandType);

        return classification;
    } catch (error) {
        throw new Error(`AOI classification failed: ${error.message}`);
    }
}

module.exports = {
    createGeoJSONPolygon,
    fetchLULCStatistics,
    parseLULCStatistics,
    classifyLand,
    classifyAOI
};
