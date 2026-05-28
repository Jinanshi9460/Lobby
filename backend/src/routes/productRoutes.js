const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { createProductValidator } = require('../validators/productValidator');
const { runValidation } = require('../middlewares/validationMiddleware');
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct, searchProducts, trendingProducts, listCategories } = require('../controllers/productController');

const router = express.Router();

router.get('/', listProducts);
router.get('/categories', listCategories);
router.get('/search', searchProducts);
router.get('/trending', trendingProducts);
router.get('/:id', getProduct);
router.post('/', verifyToken, authorizeRoles('vendor', 'admin'), createProductValidator, runValidation, createProduct);
router.put('/:id', verifyToken, authorizeRoles('vendor', 'admin'), updateProduct);
router.delete('/:id', verifyToken, authorizeRoles('vendor', 'admin'), deleteProduct);

module.exports = router;
