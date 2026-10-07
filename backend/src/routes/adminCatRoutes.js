const express = require('express');
const router = express.Router();
const adminCatController = require('../controllers/adminCatController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, verifyAdmin, adminCatController.getAllAdminCats);
router.put('/:id/hide', verifyToken, verifyAdmin, adminCatController.hideCatPost);
router.put('/:id/unhide', verifyToken, verifyAdmin, adminCatController.unhideCatPost);
router.delete('/:id', verifyToken, verifyAdmin, adminCatController.deleteCatPost);
router.delete('/:id/delete', verifyToken, verifyAdmin, adminCatController.deleteCatPost);

module.exports = router; 