const express = require('express');
const router = express.Router();
const adminAssessmentController = require('../controllers/adminAssessmentController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// /api/admin/assessments/stats/summary - ดึงข้อมูลสรุปสัดส่วนผลการประเมิน
router.get('/stats/summary', verifyToken, verifyAdmin, adminAssessmentController.getAssessmentStatsSummary);

// GET /api/admin/assessments - ดึงรายการแบบประเมินทั้งหมด
router.get('/', verifyToken, verifyAdmin, adminAssessmentController.getAssessments);

// GET /api/admin/assessments/:id - ดึงรายละเอียดแบบประเมินรายบุคคล
router.get('/:id', verifyToken, verifyAdmin, adminAssessmentController.getAssessmentById);

// PUT /api/admin/assessments/:id/status - อัปเดตสถานะแบบประเมิน
router.put('/:id/status', verifyToken, verifyAdmin, adminAssessmentController.updateAssessmentStatus);

module.exports = router;
