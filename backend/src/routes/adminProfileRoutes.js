const express = require('express');
const router = express.Router();
const adminProfileController = require('../controllers/adminProfileController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// routes
router.get('/', verifyToken, verifyAdmin, adminProfileController.getAdminProfile);

module.exports = router;