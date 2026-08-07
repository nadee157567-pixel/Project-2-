const express = require('express');
const { createAdopterProfile, getAdopterProfile, getAdopterProfileDetails } = require('../controllers/adopterController');

const router = express.Router();

router.post('/', createAdopterProfile);
router.get('/user/:userId', getAdopterProfile);
router.get('/profile/:userId', getAdopterProfileDetails);

module.exports = router;
