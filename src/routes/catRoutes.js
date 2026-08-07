const express = require('express');

const {
  getAllCats,
  getCatById,
} = require('../controllers/catController');

const router = express.Router();

router.get('/', getAllCats);
router.get('/:id', getCatById);

module.exports = router;