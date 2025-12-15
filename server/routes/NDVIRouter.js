const express = require('express');
const router = express.Router();
const { getNDVI, getImageFromIPFSHandler } = require('../handlers/NDVIHandler');

router.post('/', getNDVI);
router.get('/image', getImageFromIPFSHandler);

module.exports = router;