import * as winston from 'winston';
import * as configs from './configs';
export * as formats from './formats';
export type Logger = winston.Logger;
declare const createLogger: (userConfiguration?: winston.LoggerOptions) => winston.Logger;
export { createLogger, winston, configs };
//# sourceMappingURL=index.d.ts.map