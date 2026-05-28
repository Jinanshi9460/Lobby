const express = require('express');
const { verifyToken } = require('../middlewares/auth');
const { getChats, getMessages, sendMessage } = require('../controllers/chatController');

const router = express.Router();

router.use(verifyToken);
router.get('/', getChats);
router.get('/:chatId/messages', getMessages);
router.post('/:chatId/messages', sendMessage);

module.exports = router;
