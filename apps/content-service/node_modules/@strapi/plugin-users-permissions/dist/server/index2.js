'use strict';

var register = require('./register.js');
var index = require('./bootstrap/index.js');
var index$5 = require('./content-types/index.js');
var index$1 = require('./middlewares/index.js');
var index$2 = require('./services/index.js');
var index$3 = require('./routes/index.js');
var index$4 = require('./controllers/index.js');
var config = require('./config.js');

var server;
var hasRequiredServer;
function requireServer() {
    if (hasRequiredServer) return server;
    hasRequiredServer = 1;
    const register$1 = register.__require();
    const bootstrap = index.__require();
    const contentTypes = index$5.__require();
    const middlewares = index$1.__require();
    const services = index$2.__require();
    const routes = index$3.__require();
    const controllers = index$4.__require();
    const config$1 = config.__require();
    server = ()=>({
            register: register$1,
            bootstrap,
            config: config$1,
            routes,
            controllers,
            contentTypes,
            middlewares,
            services
        });
    return server;
}

exports.__require = requireServer;
//# sourceMappingURL=index2.js.map
