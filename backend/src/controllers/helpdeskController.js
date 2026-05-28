const HelpdeskTicket = require('../models/HelpdeskTicket');
const { ApiError } = require('../middlewares/errorHandler');

const createTicket = async (req, res, next) => {
  try {
    const { name, email, issueType, priority = 'medium', subject, message, pageUrl } = req.body;
    if (!issueType || !subject || !message) {
      throw new ApiError('Issue type, subject, and message are required', 400);
    }

    const ticket = await HelpdeskTicket.create({
      user: req.user?._id,
      name: name || req.user?.name || '',
      email: email || req.user?.email || '',
      issueType,
      priority,
      subject,
      message,
      pageUrl
    });

    res.status(201).json({ success: true, message: 'Helpdesk ticket submitted successfully', ticket });
  } catch (error) {
    next(error);
  }
};

const listTickets = async (req, res, next) => {
  try {
    const tickets = await HelpdeskTicket.find().populate('user', 'name email role').sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    next(error);
  }
};

const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const ticket = await HelpdeskTicket.findById(req.params.id);
    if (!ticket) throw new ApiError('Ticket not found', 404);
    ticket.status = status || ticket.status;
    await ticket.save();
    res.json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTicket, listTickets, updateTicketStatus };
