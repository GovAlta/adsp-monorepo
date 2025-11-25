'use strict';

var winston = require('winston');

const logErrors = winston.format((info)=>{
    if (info instanceof Error) {
        return {
            ...info,
            message: `${info.message}${info.stack ? `\n${info.stack}` : ''}`
        };
    }
    return info;
});

module.exports = logErrors;
//# sourceMappingURL=log-errors.js.map
