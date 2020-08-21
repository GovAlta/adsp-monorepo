import * as winston from 'winston';

export const createLogger = (service: string, level: string) => winston.createLogger({
  level: level || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  defaultMeta: { service: service },
  transports: [
    new winston.transports.Console()
  ]
});
