const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { checkoutValidator } = require('../validators/orderValidator');
const { runValidation } = require('../middlewares/validationMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  verifyPayment,
  dispatchOrder,
  confirmDelivery
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', verifyToken, checkoutValidator, runValidation, createOrder);
router.post('/verify', verifyToken, verifyPayment);
router.post('/verify-payment', verifyToken, verifyPayment);
router.get('/', verifyToken, getOrders);
router.get('/:id', verifyToken, getOrderById);
router.put('/:id/status', verifyToken, authorizeRoles('vendor', 'admin'), updateOrderStatus);
router.post('/:id/dispatch', verifyToken, authorizeRoles('vendor'), dispatchOrder);
router.post('/:id/confirm-delivery', verifyToken, authorizeRoles('delivery'), confirmDelivery);

module.exports = router;
