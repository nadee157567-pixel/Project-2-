const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// ดึงรายการห้องแชททั้งหมดของผู้ใช้ (ส่ง userId ผ่าน Query: /api/chats?userId=1)
router.get('/', chatController.getChats);

// ดึงข้อความในห้องแชท (ใช้ roomId: /api/chats/1/messages)
router.get('/:roomId/messages', chatController.getMessages);

module.exports = router;
