const env = process.env;

export const environment = {
  LOG_LEVEL: 'debug',
  ...env,
};
