const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

let storage;

if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'cats', // ชื่อโฟลเดอร์ใน Cloudinary
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        },
    });
} else {
    // Fallback to local disk storage when Cloudinary credentials are not set
    const uploadDir = path.join(process.cwd(), 'upload/cats');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname || '.jpg') || '.jpg';
            cb(null, 'cat-' + uniqueSuffix + ext);
        }
    });
}

module.exports = {
    cloudinary,
    storage,
};