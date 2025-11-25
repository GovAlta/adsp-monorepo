'use strict';

var winston = require('winston');
var constants = require('../constants.js');
var prettyPrint = require('../formats/pretty-print.js');
require('../formats/exclude-colors.js');
require('../formats/detailed-log.js');

var defaultConfiguration = (()=>{
    return {
        level: constants.LEVEL_LABEL,
        levels: constants.LEVELS,
        format: prettyPrint(),
        transports: [
            new winston.transports.Console()
        ]
    };
});

module.exports = defaultConfiguration;
//# sourceMappingURL=default-configuration.js.map
