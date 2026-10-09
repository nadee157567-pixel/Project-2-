const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');

router.post('/', blockController.blockUser);
router.get('/:userId', blockController.getBlockedUsers);
router.delete('/:blockerId/:blockedId', blockController.unblockUser);

module.exports = router;
