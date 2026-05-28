const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { getAssignedOrders, confirmDelivery } = require('../controllers/deliveryController');

const router = express.Router();

router.use(verifyToken, authorizeRoles('delivery'));

router.get('/orders', getAssignedOrders);
router.post('/orders/:id/confirm', confirmDelivery);

module.exports = router;
