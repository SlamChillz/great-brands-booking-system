import winston from 'winston';

const { combine, timestamp, label, printf } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    label({ label: 'booking-system' }), // Set your application label here
    myFormat
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Optionally add file transport for logging to a file
// new winston.transports.File({ filename: 'combined.log' })
