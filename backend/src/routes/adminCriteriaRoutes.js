const express = require('express');
const router = express.Router();
const adminCriteriaController = require('../controllers/adminCriteriaController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// routes
router.get('/', verifyToken, verifyAdmin, adminCriteriaController.getAllCriteria);
router.post('/', verifyToken, verifyAdmin, adminCriteriaController.createCriteria);
router.put('/:id', verifyToken, verifyAdmin, adminCriteriaController.updateCriteria);
router.delete('/:id', verifyToken, verifyAdmin, adminCriteriaController.deleteCriteria);
router.patch('/:id/toggle', verifyToken, verifyAdmin, adminCriteriaController.toggleCriteria);

module.exports = router;
