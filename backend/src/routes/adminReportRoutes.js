const express = require('express');
const router = express.Router();
const adminReportController = require('../controllers/adminReportController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/reports - ดึงรายการรายงานทั้งหมด (รองรับ ?status=Pending)
router.get('/', verifyToken, verifyAdmin, adminReportController.getReports);

// POST /api/admin/reports - สร้างรายงานใหม่
router.post('/', verifyToken, adminReportController.createReport);

// GET /api/admin/reports/:id - ดูรายละเอียดรายงาน
router.get('/:id', verifyToken, verifyAdmin, adminReportController.getReportDetail);

// POST /api/admin/reports/:id/update - อัปเดตสถานะรายงาน (จัดการ/แบน)
router.post('/:id/update', verifyToken, verifyAdmin, adminReportController.updateReportStatus);

// PUT /api/admin/reports/:id/status - REST alias สำหรับอัปเดตสถานะ
router.put('/:id/status', verifyToken, verifyAdmin, adminReportController.updateReportStatus);

module.exports = router;