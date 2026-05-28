const express = require('express');
const { listShops, getShop, getShopProducts } = require('../controllers/shopController');

const router = express.Router();

router.get('/', listShops);
router.get('/:id', getShop);
router.get('/:id/products', getShopProducts);

module.exports = router;
