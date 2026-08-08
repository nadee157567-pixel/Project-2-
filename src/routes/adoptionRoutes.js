const express = require('express');
const { createAdoptionRequest, getRequestsByAdopter, getRequestsByCat, updateRequestStatus } = require('../controllers/adoptionController');

const router = express.Router();

router.post('/request', createAdoptionRequest);
router.get('/adopter/:userId', getRequestsByAdopter);
router.get('/cat/:catId', getRequestsByCat);
router.put('/request/:matchId/status', updateRequestStatus);

module.exports = router;
