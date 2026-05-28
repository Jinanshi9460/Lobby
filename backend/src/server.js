require('dotenv').config();
const http = require('http');
const app = require('./app');
const socketServer = require('./config/socket');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    socketServer(server);

    server.listen(PORT, () => {
      console.log(`LOBBy backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
