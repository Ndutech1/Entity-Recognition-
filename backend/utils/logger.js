//backend/Utils/logger.js
const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

const logDir = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const baseFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const details = Object.keys(meta).length
      ? ` ${JSON.stringify(meta)}`
      : '';

    return `${timestamp} ${level}: ${stack || message}${details}`;
  })
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'nigeria-ner-backend' },
  transports: [
    new transports.Console({
      format: consoleFormat,
    }),
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: baseFormat,
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: baseFormat,
    }),
  ],
});

module.exports = logger;
