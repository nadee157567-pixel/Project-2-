const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// routes
router.get('/', verifyToken, verifyAdmin, adminUserController.getAllUsers);
router.get('/:id', verifyToken, verifyAdmin, adminUserController.getUserById);
router.put('/:id', verifyToken, verifyAdmin, adminUserController.toggleUserStatus);

module.exports = router;
