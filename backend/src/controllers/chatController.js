const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { ApiError } = require('../middlewares/errorHandler');

const getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id }).populate('vendor user', 'storeName name email');
    res.json({ success: true, chats });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError('Chat not found', 404);
    const message = await Message.create({ chat: chatId, sender: req.user._id, text: req.body.text });
    chat.lastMessage = req.body.text;
    await chat.save();
    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

module.exports = { getChats, getMessages, sendMessage };
