//backend/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const articleRoutes = require('./routes/article.routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const app = express();

app.use(cors());
app.use(helmet());
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);
app.use(express.json());

app.use('/api/articles', articleRoutes);

//404 handler
app.use(((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    }); 
}));

// Global error handler
app.use(errorHandler);

module.exports = app;
