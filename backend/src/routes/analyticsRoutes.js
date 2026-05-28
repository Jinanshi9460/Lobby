const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { getAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.use(verifyToken, authorizeRoles('admin', 'vendor'));
router.get('/', getAnalytics);

module.exports = router;
