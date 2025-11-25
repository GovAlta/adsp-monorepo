'use strict';

var perf_hooks = require('perf_hooks');

function getTimer() {
    const timings = {};
    const startTimes = {};
    function start(name) {
        if (typeof startTimes[name] !== 'undefined') {
            throw new Error(`Timer "${name}" already started, cannot overwrite`);
        }
        startTimes[name] = perf_hooks.performance.now();
    }
    function end(name) {
        if (typeof startTimes[name] === 'undefined') {
            throw new Error(`Timer "${name}" never started, cannot end`);
        }
        timings[name] = perf_hooks.performance.now() - startTimes[name];
        return timings[name];
    }
    return {
        start,
        end,
        getTimings: ()=>timings
    };
}
const prettyTime = (timeInMs)=>{
    return `${Math.ceil(timeInMs)}ms`;
};

exports.getTimer = getTimer;
exports.prettyTime = prettyTime;
//# sourceMappingURL=timer.js.map
