const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// ดึงการแจ้งเตือนทั้งหมดของผู้ใช้
router.get('/:userId', notificationController.getNotifications);

// ดึงจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
router.get('/unread-counts/:userId', notificationController.getUnreadCounts);

// อัปเดตการอ่าน
router.put('/:userId/read', notificationController.markAsRead);

module.exports = router;
