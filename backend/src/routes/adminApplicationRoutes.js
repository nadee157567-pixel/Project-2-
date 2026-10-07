const express = require('express');
const router = express.Router();
const adminApplicationController = require('../controllers/adminApplicationController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// routes
// get / api / admin / applications - ดึงรายการคำขอรับเลี้ยงทั้งหมด
router.get('/', verifyToken, verifyAdmin, adminApplicationController.getAllApplications);

// get / api / admin / applications /:id - ดึงรายละเอียดคำขอรับเลี้ยง 1 รายการ
router.get('/:id', verifyToken, verifyAdmin, adminApplicationController.getApplicationById);

// บังคับเปลี่ยนสถานะคำขอรับเลี้ยง (Admin)
router.put('/:id/status', verifyToken, verifyAdmin, adminApplicationController.overrideApplicationStatus);

module.exports = router;