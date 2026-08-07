const express = require('express');
const { createAdoptionRequest, getRequestsByAdopter, getRequestsByCat } = require('../controllers/adoptionController');

const router = express.Router();

router.post('/request', createAdoptionRequest);
router.get('/adopter/:userId', getRequestsByAdopter);
router.get('/cat/:catId', getRequestsByCat);

module.exports = router;
