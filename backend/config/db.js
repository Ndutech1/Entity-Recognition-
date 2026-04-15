// backend/config/db.js
const mongoose = require('mongoose');
const logger = require('../Utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    logger.info('MongoDB connected', {
      host: conn.connection.host,
      database: conn.connection.name,
    });
  } catch (error) {
    logger.error('MongoDB connection failed', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

module.exports = connectDB;
