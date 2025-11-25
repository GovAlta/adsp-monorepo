'use strict';

var register = require('./register.js');
var bootstrap = require('./bootstrap.js');
var destroy = require('./destroy.js');
var index$2 = require('./routes/index.js');
var index$3 = require('./policies/index.js');
var index$1 = require('./controllers/index.js');
var index$4 = require('./services/index.js');

var index = (()=>{
    return {
        register,
        bootstrap,
        destroy,
        controllers: index$1,
        routes: index$2,
        policies: index$3,
        services: index$4
    };
});

module.exports = index;
//# sourceMappingURL=index.js.map
