'use strict';

var timer = require('./timer.js');

class TimerFactory {
    create() {
        return new timer.Timer();
    }
}

exports.TimerFactory = TimerFactory;
//# sourceMappingURL=factory.js.map
