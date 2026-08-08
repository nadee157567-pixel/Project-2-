const express = require('express');
const { signup, login, getUserById, updateUser } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/user/:id', getUserById);
router.put('/user/:id', updateUser);

module.exports = router;
