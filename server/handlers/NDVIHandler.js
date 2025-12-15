async function getNDVI(req, res) {
    console.log("NDVI computation request received");
    try {
        console.log("Extracting request body parameters");
        const { forest_id, min_lon, max_lon, min_lat, max_lat } = req.body;
        console.log("Forest ID: ", forest_id);
        console.log("Min Longitude: ", min_lon);
        console.log("Max Longitude: ", max_lon);
        console.log("Min Latitude: ", min_lat);
        console.log("Max Latitude: ", max_lat);

        // Validate required fields
        console.log("Validating required fields");
        if (!forest_id || min_lon === undefined || max_lon === undefined || min_lat === undefined || max_lat === undefined) {
            console.log("Validation failed - missing required fields");
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['forest_id', 'min_lon', 'max_lon', 'min_lat', 'max_lat']
            });
        }
        console.log("All required fields are present");

        // Make request to Python backend
        console.log("Preparing request to Python backend");
        const requestBody = {
            forest_id,
            min_lon,
            max_lon,
            min_lat,
            max_lat
        };
        console.log("Request body prepared: ", requestBody);
        console.log("Sending POST request to http://localhost:8000/ndvi");
        
        const response = await fetch("http://localhost:8000/ndvi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody)
        });

        console.log("Response received from Python backend");
        console.log("Response status: ", response.status);

        if (!response.ok) {
            console.log("Python backend returned an error status");
            const errorText = await response.text();
            console.error("Python backend error details:", errorText);
            return res.status(response.status).json({ 
                error: 'Failed to compute NDVI',
                details: errorText
            });
        }

        console.log("Parsing response JSON from Python backend");
        const data = await response.json();
        console.log("NDVI computation successful");
        console.log("NDVI result: ", data);
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error in getNDVI handler:", error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
}

module.exports = { getNDVI };