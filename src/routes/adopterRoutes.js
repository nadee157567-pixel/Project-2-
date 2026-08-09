const express = require('express');

const { createAdopterProfile, getAdopterProfile, getAdopterProfileDetails, updateAdopterProfile } = require('../controllers/adopterController');

const router = express.Router();

router.post('/', createAdopterProfile);
router.get('/user/:userId', getAdopterProfile);
router.get('/profile/:userId', getAdopterProfileDetails);
router.put('/profile/:id', updateAdopterProfile);

module.exports = router;
