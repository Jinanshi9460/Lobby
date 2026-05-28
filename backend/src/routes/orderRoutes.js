const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { checkoutValidator } = require('../validators/orderValidator');
const { runValidation } = require('../middlewares/validationMiddleware');
const { createOrder, getOrders, getOrderById, updateOrderStatus, verifyPayment } = require('../controllers/orderController');

const router = express.Router();

router.post('/', verifyToken, checkoutValidator, runValidation, createOrder);
router.post('/verify', verifyToken, verifyPayment);
router.get('/', verifyToken, getOrders);
router.get('/:id', verifyToken, getOrderById);
router.put('/:id/status', verifyToken, authorizeRoles('vendor', 'admin'), updateOrderStatus);

module.exports = router;
