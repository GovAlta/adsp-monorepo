import axios from 'axios';
import { Logger } from 'winston';

export function instrumentAxios(logger: Logger) {
  const timings = new Map();

  axios.interceptors.request.use(function (config) {
    timings.set(config, process.hrtime());
    return config;
  });

  axios.interceptors.response.use(function (response) {
    const config = response?.config;
    if (config) {
      const start = timings.get(config);
      if (start) {
        timings.delete(config);

        const [sec, nano] = process.hrtime(start);
        const duration = Math.round(sec * 1e3 + nano * 1e-6);

        const trace = config.headers?.get('traceparent');
        logger.debug(`Timing for request to ${config.url}: ${duration} ms`, { context: 'Instrumentation', trace });
      }
    }
    return response;
  });
}
