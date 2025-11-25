'use strict';

var winston = require('winston');
var constants = require('../constants.js');
var prettyPrint = require('../formats/pretty-print.js');
var excludeColors = require('../formats/exclude-colors.js');
require('../formats/detailed-log.js');

var outputFileConfiguration = ((filename, fileTransportOptions = {})=>{
    return {
        level: constants.LEVEL_LABEL,
        levels: constants.LEVELS,
        format: prettyPrint(),
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({
                level: 'error',
                filename,
                format: excludeColors,
                ...fileTransportOptions
            })
        ]
    };
});

module.exports = outputFileConfiguration;
//# sourceMappingURL=output-file-configuration.js.map
