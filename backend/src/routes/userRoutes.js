const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const {
  getProfile,
  updateProfile,
  addAddress,
  getNotifications,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require('../controllers/userController');

const router = express.Router();

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.post('/address', verifyToken, addAddress);
router.get('/notifications', verifyToken, getNotifications);
router.get('/cart', verifyToken, getCart);
router.post('/cart', verifyToken, addToCart);
router.put('/cart/:productId', verifyToken, updateCartItem);
router.delete('/cart/:productId', verifyToken, removeCartItem);
router.delete('/cart', verifyToken, clearCart);

module.exports = router;
