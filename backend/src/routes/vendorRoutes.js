const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { vendorRegisterValidator } = require('../validators/vendorValidator');
const { runValidation } = require('../middlewares/validationMiddleware');
const {
  registerVendor,
  getVendorProfile,
  approveVendor,
  vendorSales,
  exportVendorCsv,
  getVendorProducts,
  createVendorProduct,
  deleteVendorProduct,
  updateVendorSettings
} = require('../controllers/vendorController');
const {
  listDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner
} = require('../controllers/deliveryPartnerController');

const router = express.Router();

router.post('/register', verifyToken, vendorRegisterValidator, runValidation, registerVendor);
router.get('/me', verifyToken, authorizeRoles('vendor'), getVendorProfile);
router.put('/:id/approve', verifyToken, authorizeRoles('admin'), approveVendor);
router.get('/analytics', verifyToken, authorizeRoles('vendor'), vendorSales);
router.get('/export/csv', verifyToken, authorizeRoles('vendor'), exportVendorCsv);
router.get('/products', verifyToken, authorizeRoles('vendor'), getVendorProducts);
router.post('/products', verifyToken, authorizeRoles('vendor'), createVendorProduct);
router.delete('/products/:id', verifyToken, authorizeRoles('vendor'), deleteVendorProduct);
router.put('/settings', verifyToken, authorizeRoles('vendor'), updateVendorSettings);
router.get('/delivery-partners', verifyToken, authorizeRoles('vendor'), listDeliveryPartners);
router.post('/delivery-partners', verifyToken, authorizeRoles('vendor'), createDeliveryPartner);
router.put('/delivery-partners/:id', verifyToken, authorizeRoles('vendor'), updateDeliveryPartner);
router.delete('/delivery-partners/:id', verifyToken, authorizeRoles('vendor'), deleteDeliveryPartner);

module.exports = router;
