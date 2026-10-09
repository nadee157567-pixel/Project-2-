const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/', reportController.createReport);
router.post('/:reportId/photos', upload.array('evidence_images', 5), reportController.uploadReportPhotos);
router.put('/:reportId/status', reportController.updateReportStatus);

module.exports = router;
