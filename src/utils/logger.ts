import winston from 'winston';

const { combine, timestamp, label, printf, json } = winston.format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    label({ label: 'booking-system' }),
    myFormat,
    json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});
