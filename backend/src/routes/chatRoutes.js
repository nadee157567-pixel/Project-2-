const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// ดึงรายการห้องแชททั้งหมดของผู้ใช้ (ส่ง userId ผ่าน Query: /api/chats?userId=1)
router.get('/', chatController.getChats);
router.post('/send-message', chatController.sendMessage);

// ดึงข้อความในห้องแชท (ใช้ roomId: /api/chats/1/messages)
router.get('/:roomId/messages', chatController.getMessages);

// สร้างห้องแชท
router.post('/room', chatController.createRoom);

// อัปเดตสถานะการอ่านข้อความ
router.put('/:roomId/read', chatController.updateIsRead);
// ลบห้องแชท
router.delete('/:roomId', chatController.deleteChat);

module.exports = router;
