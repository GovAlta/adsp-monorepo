'use strict';

var factory = require('../../registries/factory.js');
var factory$1 = require('../../utils/timer/factory.js');
require('debug');
require('node:crypto');
require('zod/v4');
var abstract = require('./abstract.js');

class OperationContextFactory extends abstract.AbstractContextFactory {
    create(context) {
        return super.create(context, {});
    }
    constructor(registriesFactory = new factory.RegistriesFactory(), timerFactory = new factory$1.TimerFactory()){
        super(registriesFactory, timerFactory);
    }
}

exports.OperationContextFactory = OperationContextFactory;
//# sourceMappingURL=operation.js.map
