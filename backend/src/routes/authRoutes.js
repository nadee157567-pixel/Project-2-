const express = require('express');
const { signup, login, getUserById, updateUser, verifyAdminPassword } = require('../controllers/authController');

const { validateSignup } = require('../middleware/validationMiddleware');


const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', login);
router.post('/verify-password', verifyAdminPassword);
router.get('/user/:id', getUserById);
router.put('/user/:id', updateUser);

// router.put('/user/:id', updateUser);

module.exports = router;
