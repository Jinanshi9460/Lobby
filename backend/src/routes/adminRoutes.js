const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const {
  getDashboardStats,
  listUsers,
  listVendors,
  approveVendor,
  rejectVendor,
  removeVendor,
  suspendUser,
  listShops,
  toggleShopStatus,
  listProducts,
  toggleProductStatus,
  exportAdminCsv
} = require('../controllers/adminController');

const router = express.Router();

router.use(verifyToken, authorizeRoles('admin'));
router.get('/stats', getDashboardStats);
router.get('/export/csv', exportAdminCsv);
router.get('/users', listUsers);
router.get('/vendors', listVendors);
router.put('/vendors/:id/approve', approveVendor);
router.put('/vendors/:id/reject', rejectVendor);
router.delete('/vendors/:id', removeVendor);
router.put('/users/:id/suspend', suspendUser);
router.get('/shops', listShops);
router.put('/shops/:id/toggle', toggleShopStatus);
router.get('/products', listProducts);
router.put('/products/:id/toggle', toggleProductStatus);

module.exports = router;
