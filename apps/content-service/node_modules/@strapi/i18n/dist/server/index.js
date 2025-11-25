'use strict';

var bootstrap = require('./bootstrap.js');
var register = require('./register.js');
var index$3 = require('./content-types/index.js');
var index$4 = require('./services/index.js');
var index$1 = require('./routes/index.js');
var index$2 = require('./controllers/index.js');

var index = (()=>({
        register,
        bootstrap,
        routes: index$1,
        controllers: index$2,
        contentTypes: index$3,
        services: index$4
    }));

module.exports = index;
//# sourceMappingURL=index.js.map
