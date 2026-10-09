const express = require('express');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/authMiddleware');
const { validateCatPost } = require('../middleware/validationMiddleware');

const { storage } = require('../config/cloudinary');

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ที่ 5MB
    }
});

const {
    getAllCats,
    getCatById,
    createCat,
    getCatsByPosterId,
    updateCat,              // ฟังก์ชันจากฝั่ง main และ api
    deleteCat,              // ฟังก์ชันจากฝั่ง api
    uploadCatPhoto,         // ฟังก์ชันจากฝั่ง api
    deleteCatPhoto,         // ฟังก์ชันจากฝั่ง api
    updateCatPhoto          // ฟังก์ชันจากฝั่ง api
} = require('../controllers/catController');

const router = express.Router();

// เส้นทางจัดการข้อมูลแมวทั่วไป (รวมกันทั้งจากฝั่ง api และ main)
router.get('/', getAllCats);
router.get('/:id', getCatById);
router.post('/', createCat);
router.put('/:id', updateCat);
router.delete('/:id', deleteCat);

router.get('/poster/:id', getCatsByPosterId);

// เส้นทางสำหรับจัดการรูปภาพแมวโดยเฉพาะ (จากฝั่ง api)
router.post('/:catId/photos', upload.array('photos', 5), uploadCatPhoto);
router.delete('/:catId/photos/:photoId', deleteCatPhoto);
router.put('/:catId/photos/:photoId', updateCatPhoto);

// Protected routes (requires Login) - ปิดไว้ก่อนเพราะ Flutter ยังไม่ส่ง Token
// router.post('/', verifyToken, validateCatPost, createCat);
// router.put('/:id', verifyToken, validateCatPost, updateCat);
// router.delete('/:id', verifyToken, deleteCat);

// Photo management routes (Protected)
// router.post('/:catId/photos', verifyToken, upload.array('photos', 5), uploadCatPhoto);
// router.delete('/:catId/photos/:photoId', verifyToken, deleteCatPhoto);
// router.put('/:catId/photos/:photoId', verifyToken, updateCatPhoto);

module.exports = router;