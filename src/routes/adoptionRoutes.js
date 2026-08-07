const express = require('express');
const router = express.Router();

const { createApplication } = require('../controllers/adoptionController');

// ส่งคำร้องขอรับเลี้ยง
// POST /api/applications/
router.post('/', createApplication);

module.exports = router;