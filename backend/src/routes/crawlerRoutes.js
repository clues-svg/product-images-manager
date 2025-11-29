const express = require('express');
const router = express.Router();
const crawlerController = require('../controllers/crawlerController');
const auth = require('../middlewares/auth'); // Assuming auth middleware exists

// Protect crawler routes with auth
router.post('/crawl', auth, crawlerController.crawl);

module.exports = router;
