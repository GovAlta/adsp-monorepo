import { performance } from 'perf_hooks';

function getTimer() {
    const timings = {};
    const startTimes = {};
    function start(name) {
        if (typeof startTimes[name] !== 'undefined') {
            throw new Error(`Timer "${name}" already started, cannot overwrite`);
        }
        startTimes[name] = performance.now();
    }
    function end(name) {
        if (typeof startTimes[name] === 'undefined') {
            throw new Error(`Timer "${name}" never started, cannot end`);
        }
        timings[name] = performance.now() - startTimes[name];
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

export { getTimer, prettyTime };
//# sourceMappingURL=timer.mjs.map
