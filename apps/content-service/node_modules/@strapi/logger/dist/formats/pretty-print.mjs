import { format } from 'winston';
import logErrors from './log-errors.mjs';

const defaultTimestampFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
/**
 * Create a pretty print formatter for a winston logger
 * @param options
 */ var prettyPrint = ((options = {})=>{
    const { timestamps = true, colors = true } = options;
    const handlers = [];
    if (timestamps) {
        handlers.push(format.timestamp({
            format: timestamps === true ? defaultTimestampFormat : timestamps
        }));
    }
    if (colors) {
        handlers.push(format.colorize());
    }
    handlers.push(logErrors());
    handlers.push(format.printf(({ level, message, timestamp })=>{
        return `${timestamps ? `[${timestamp}] ` : ''}${level}: ${message}`;
    }));
    return format.combine(...handlers);
});

export { prettyPrint as default };
//# sourceMappingURL=pretty-print.mjs.map
