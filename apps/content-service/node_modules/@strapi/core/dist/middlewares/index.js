'use strict';

var compression = require('./compression.js');
var cors = require('./cors.js');
var errors = require('./errors.js');
var favicon = require('./favicon.js');
var ip = require('./ip.js');
var logger = require('./logger.js');
var poweredBy = require('./powered-by.js');
var body = require('./body.js');
var query = require('./query.js');
var responseTime = require('./response-time.js');
var responses = require('./responses.js');
var security = require('./security.js');
var session = require('./session.js');
var _public = require('./public.js');

const middlewares = {
    compression: compression.compression,
    cors: cors.cors,
    errors: errors.errors,
    favicon: favicon.favicon,
    ip: ip.ip,
    logger: logger.logger,
    poweredBy: poweredBy.poweredBy,
    body: body.body,
    query: query.query,
    responseTime: responseTime.responseTime,
    responses: responses.responses,
    security: security.security,
    session: session.session,
    public: _public.publicStatic
};

exports.middlewares = middlewares;
//# sourceMappingURL=index.js.map
