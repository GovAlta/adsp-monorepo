import * as winston from 'winston';

const levels = {
  critical: 0,
  alert: 1,
  error: 2,
  warn: 3,
  info: 4,
  debug: 5,
  verbose: 6,
};

const colors = {
  critical: 'red',
  alert: 'red',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'blue',
};

export const createLogger = (service: string, level: string) =>
  winston.createLogger({
    level: level || 'info',
    levels: levels,
    format: winston.format.combine(winston.format.timestamp(), winston.format.colorize(), winston.format.simple()),
    defaultMeta: { service: service },
    transports: [new winston.transports.Console()],
  });

winston.addColors(colors);
