import * as winston from 'winston';
import { getContextTrace } from '../trace';

export const addTraceFormat = winston.format((info) => {
  const trace = getContextTrace();
  if (trace && !info.trace) {
    info.trace = trace.toString();
  }
  return info;
});

export const createLogger = (service: string, level?: string): winston.Logger =>
  winston.createLogger({
    level: level || 'info',
    format: winston.format.combine(
      addTraceFormat(),
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.simple()
    ),
    defaultMeta: { service: service },
    transports: [new winston.transports.Console()],
  });
