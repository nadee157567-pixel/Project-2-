const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/dashboard/stats - ดึงสถิติทั้งหมดสำหรับหน้า Dashboard
router.get('/stats', verifyToken, verifyAdmin, adminDashboardController.getDashboardStats);

// GET /api/admin/dashboard/activity - ดึงกิจกรรมล่าสุด
router.get('/activity', verifyToken, verifyAdmin, adminDashboardController.getLatestActivity);

// GET /api/admin/dashboard/trends - ดึงสถิติแนวโน้มการหาบ้านสำเร็จในแต่ละเดือน สำหรับกราฟ
router.get('/trends', verifyToken, verifyAdmin, adminDashboardController.getMonthlyAdoptionTrends);

// GET /api/admin/dashboard/export - ส่งออกข้อมูลสถิติ แดชบอร์ด ผู้ใช้งาน คำขอรับเลี้ยง หรือกราฟ เป็น Excel/CSV
router.get('/export', verifyToken, verifyAdmin, adminDashboardController.exportDashboardReport);

module.exports = router;