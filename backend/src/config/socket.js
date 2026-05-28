const { Server } = require('socket.io');
const User = require('../models/User');

const socketServer = server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', socket => {
    socket.on('joinRoom', room => socket.join(room));
    socket.on('leaveRoom', room => socket.leave(room));
    socket.on('sendMessage', payload => {
      const { room, message } = payload;
      io.to(room).emit('receiveMessage', message);
    });
    socket.on('orderUpdate', payload => {
      io.to(payload.userId).emit('orderUpdate', payload);
    });
    socket.on('notification', payload => {
      io.to(payload.userId).emit('notification', payload);
    });
    socket.on('disconnect', () => {});
  });
};

module.exports = socketServer;
