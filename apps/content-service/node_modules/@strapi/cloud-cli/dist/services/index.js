'use strict';

var cliApi = require('./cli-api.js');
var strapiInfoSave = require('./strapi-info-save.js');
var token = require('./token.js');
var logger = require('./logger.js');



exports.cloudApiFactory = cliApi.cloudApiFactory;
exports.local = strapiInfoSave;
exports.tokenServiceFactory = token.tokenServiceFactory;
exports.createLogger = logger.createLogger;
//# sourceMappingURL=index.js.map
