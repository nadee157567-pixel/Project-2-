const express = require('express');

const {
  getAllCats,
  getCatById,
  createCat,
  getCatsByPosterId
} = require('../controllers/catController');

const router = express.Router();

router.get('/', getAllCats);
router.get('/:id', getCatById);
router.post('/', createCat);
router.get('/poster/:id', getCatsByPosterId);

module.exports = router;