const express = require('express');
const { verifyToken } = require('../middlewares/auth');
const { listNotifications, markAsRead } = require('../controllers/notificationController');

const router = express.Router();

router.use(verifyToken);
router.get('/', listNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;
