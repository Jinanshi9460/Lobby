const mongoose = require('mongoose');

const helpdeskTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, trim: true },
  email: { type: String, trim: true },
  issueType: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  pageUrl: { type: String, trim: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HelpdeskTicket', helpdeskTicketSchema);
