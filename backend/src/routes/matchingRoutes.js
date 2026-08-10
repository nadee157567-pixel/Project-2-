const express = require('express');

const{
    matchSelectedCat,
    matchAllCats,
} = require('../controllers/matchingController');

const router = express.Router();

// ประเมินแมวทุกตัว (ใช้สำหรับหน้าแนะนำแมว)
router.post('/', matchAllCats);

// ประเมินเฉพาะแมวที่ผู้ใช้เลือก
router.post('/:catId', matchSelectedCat);

module.exports = router;