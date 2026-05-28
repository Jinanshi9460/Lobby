const mongoose = require('mongoose');
const dns = require('dns');

const configureDns = () => {
  const dnsServers = (process.env.MONGO_DNS_SERVERS || '8.8.8.8,1.1.1.1')
    .split(',')
    .map(server => server.trim())
    .filter(Boolean);

  if (dnsServers.length) {
    dns.setServers(dnsServers);
  }
};

const connectDB = async () => {
  configureDns();
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lobby';
  await mongoose.connect(uri);
  console.log(`MongoDB connected (${mongoose.connection.host})`);
};

module.exports = connectDB;
