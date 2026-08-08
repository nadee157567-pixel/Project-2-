const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const { createAdopterProfile, getAdopterProfile, getAdopterProfileDetails, updateAdopterProfile } = require('../controllers/adopterController');

const router = express.Router();

router.post('/', verifyToken, createAdopterProfile);
router.get('/user/:userId', verifyToken, getAdopterProfile);
router.get('/profile/:userId', verifyToken, getAdopterProfileDetails);
router.put('/profile/:id', verifyToken, updateAdopterProfile);

module.exports = router;
