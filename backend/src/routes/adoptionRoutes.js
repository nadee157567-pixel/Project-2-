const express = require('express');
const { 
    createApplication,            // ฟังก์ชันจากฝั่ง api
    createAdoptionRequest,        // ฟังก์ชันจากฝั่ง main
    getRequestsByAdopter,         // ฟังก์ชันจากฝั่ง main
    getRequestsByCat,             // ฟังก์ชันจากฝั่ง main
    updateRequestStatus,          // ฟังก์ชันจากฝั่ง main (สำหรับปุ่มอนุมัติ/ปฏิเสธ)
    getAssessmentDetails          // ดึงรายละเอียดการประเมิน
} = require('../controllers/adoptionController');
const router = express.Router();
// ส่งคำร้องขอรับเลี้ยง (รูปแบบโครงสร้างจากฝั่ง api)
// POST /api/applications/ หรือตามที่ตั้งไว้ใน index
router.post('/', createApplication);
// เส้นทางสำหรับระบบประวัติการขอรับเลี้ยงและระบบอนุมัติ (รูปแบบจากฝั่ง main)
router.post('/request', createAdoptionRequest);
router.get('/adopter/:userId', getRequestsByAdopter);
router.get('/cat/:catId', getRequestsByCat);
router.put('/request/:matchId/status', updateRequestStatus);
router.get('/assessment/:applicantId/:catId', getAssessmentDetails);
module.exports = router;
