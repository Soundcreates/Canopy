const express = require('express');
const router = express.Router();
const { getNDVI } = require('../handlers/NDVIHandler');

router.post('/', getNDVI);

module.exports = router;