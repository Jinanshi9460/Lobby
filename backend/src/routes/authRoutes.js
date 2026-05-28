const express = require('express');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { runValidation } = require('../middlewares/validationMiddleware');
const { register, login, adminLogin, refreshToken, logout, profile, forgotPassword, resetPassword, googleAuth } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', registerValidator, runValidation, register);
router.post('/login', loginValidator, runValidation, login);
router.post('/google', googleAuth);
router.post('/login/admin', loginValidator, runValidation, adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', verifyToken, profile);

module.exports = router;
