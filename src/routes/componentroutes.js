const express = require('express');
const router = express.Router();
const componentController = require('../controllers/componentcontrollers');

// Route to generate a new component
router.post('/generate-component', componentController.generateComponent);

// Route to get recent components
router.get('/recent-components', componentController.getRecentComponents);

module.exports = router;
