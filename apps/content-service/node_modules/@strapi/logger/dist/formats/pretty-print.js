'use strict';

var winston = require('winston');
var logErrors = require('./log-errors.js');

const defaultTimestampFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
/**
 * Create a pretty print formatter for a winston logger
 * @param options
 */ var prettyPrint = ((options = {})=>{
    const { timestamps = true, colors = true } = options;
    const handlers = [];
    if (timestamps) {
        handlers.push(winston.format.timestamp({
            format: timestamps === true ? defaultTimestampFormat : timestamps
        }));
    }
    if (colors) {
        handlers.push(winston.format.colorize());
    }
    handlers.push(logErrors());
    handlers.push(winston.format.printf(({ level, message, timestamp })=>{
        return `${timestamps ? `[${timestamp}] ` : ''}${level}: ${message}`;
    }));
    return winston.format.combine(...handlers);
});

module.exports = prettyPrint;
//# sourceMappingURL=pretty-print.js.map
