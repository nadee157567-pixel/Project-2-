const express = require('express');

const {
  getAllCats,
  getCatById,
  createCat,
  getCatsByPosterId,
  updateCat
} = require('../controllers/catController');

const router = express.Router();

router.get('/', getAllCats);
router.get('/:id', getCatById);
router.post('/', createCat);
router.put('/:id', updateCat);
router.get('/poster/:id', getCatsByPosterId);

module.exports = router;