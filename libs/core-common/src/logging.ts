import * as winston from 'winston';

export interface AdspAppLogOpts {
  tenantId?: string;
  showService?: boolean;
  status?: 'started' | 'finished' | 'in-progress' | 'failed';
  action?: string;
  jobId?: string;
}

export interface AdspLoggerOpts extends AdspAppLogOpts {
  service?: string;
  timestamp: string;
  message?: string;
}

export const createLoggerMessage = (data: AdspLoggerOpts) => {
  let message = data?.message || '';
  const { tenantId, status, action, jobId, showService, service } = data;
  if (status) {
    message = `${status} ${message}`;
  }

  if (action) {
    message = `${action} ${message}`;
  }

  let messageHeader = '';

  if (jobId) {
    messageHeader = `[${jobId}]${messageHeader}`;
  }

  if (tenantId) {
    messageHeader = `[${tenantId}]${messageHeader}`;
  }

  if (showService === true) {
    messageHeader = `[${service}]${messageHeader}`;
  }

  if (message) {
    message = `${messageHeader} ${message}`;
  } else {
    message = messageHeader;
  }

  return message;
};

export const adspLoggerFormatter = winston.format((info) => {
  // the default type for info is any
  info.message = createLoggerMessage(info as unknown as AdspLoggerOpts);
  return info;
})();

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

export const createLogger = (service: string, level?: string): winston.Logger =>
  winston.createLogger({
    level: level || 'info',
    levels: levels,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      adspLoggerFormatter,
      winston.format.printf(({ level, message, timestamp }) => `[${level}][${timestamp}]${message}`)
    ),
    defaultMeta: { service: service },
    transports: [new winston.transports.Console()],
  });

winston.addColors(colors);
