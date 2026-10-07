const express = require('express');
const router = express.Router();
const adminLogController = require('../controllers/adminLogController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/logs - ดึงรายการ Audit Logs (รองรับ page, limit, action, search, startDate, endDate)
router.get('/', verifyToken, verifyAdmin, adminLogController.getLogs);

// GET /api/admin/logs/actions - ดึงรายการประเภท Action ทั้งหมดที่มี
router.get('/actions', verifyToken, verifyAdmin, adminLogController.getLogActions);

// GET /api/admin/logs/:id - ดูรายละเอียด Audit Log รายการเดียว
router.get('/:id', verifyToken, verifyAdmin, adminLogController.getLogDetail);

module.exports = router;
