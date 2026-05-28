const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { createTicket, listTickets, updateTicketStatus } = require('../controllers/helpdeskController');

const router = express.Router();

router.post('/', createTicket);
router.get('/admin', verifyToken, authorizeRoles('admin'), listTickets);
router.put('/:id/status', verifyToken, authorizeRoles('admin'), updateTicketStatus);

module.exports = router;
