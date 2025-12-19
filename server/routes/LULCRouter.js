const express = require('express');
const router = express.Router();
const { classifyLandUse } = require('../handlers/LULCHandler');

/**
 * POST /api/lulc/classify
 * 
 * Classifies a geographic bounding box as built-up or non-built-up
 * using ISRO Bhuvan LULC 50k data.
 * 
 * Request body:
 * {
 *   "minLat": number,
 *   "maxLat": number,
 *   "minLon": number,
 *   "maxLon": number
 * }
 */
router.post('/classify', classifyLandUse);

module.exports = router;

