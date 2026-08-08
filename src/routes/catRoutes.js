const express = require('express');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/authMiddleware');
const { validateCatPost } = require('../middleware/validationMiddleware');

// ตั้งค่า Multer สำหรับเก็บไฟล์ไว้ในโฟลเดอร์ 'upload/' ของ Server
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload/cats/');
    },
    filename: function (req, file, cb) {
        // ตั้งชื่อไฟล์
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cat-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// กรองชนิดของไฟล์ (รับเฉพาะรูปภาพ)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WEBP) เท่านั้น!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ที่ 5MB
    },
    fileFilter: fileFilter
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
router.post('/:catId/photos', uploadCatPhoto);
router.put('/:catId/photos/:photoId', updateCatPhoto);
router.delete('/:catId/photos/:photoId', deleteCatPhoto);

// Protected routes (requires Login)
router.post('/', verifyToken, validateCatPost, createCat);
router.put('/:id', verifyToken, validateCatPost, updateCat);
router.delete('/:id', verifyToken, deleteCat);

// Photo management routes (Protected)
router.post('/:catId/photos', verifyToken, upload.array('photos', 5), uploadCatPhoto);
router.delete('/:catId/photos/:photoId', verifyToken, deleteCatPhoto);
router.put('/:catId/photos/:photoId', verifyToken, updateCatPhoto);

module.exports = router;