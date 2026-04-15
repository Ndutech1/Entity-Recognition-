//backend/server.js
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./Utils/logger');

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});
