'use strict';

class Timer {
    start() {
        if (this._startTime !== null) {
            throw new Error('Timer is already started. Use `reset()` to reset the timer before starting it again.');
        }
        this._startTime = Date.now();
        this._endTime = null;
        this._elapsedTime = null;
        return this._startTime;
    }
    stop() {
        if (this._startTime === null) {
            throw new Error('Timer is not started. Use `start()` to start the timer before stopping it.');
        }
        this._endTime = Date.now();
        this._elapsedTime = this._endTime - this._startTime;
        return {
            startTime: this._startTime,
            endTime: this._endTime,
            elapsedTime: this._elapsedTime
        };
    }
    reset() {
        this._startTime = null;
        this._endTime = null;
        this._elapsedTime = null;
    }
    constructor(){
        this._startTime = null;
        this._endTime = null;
        this._elapsedTime = null;
    }
}

exports.Timer = Timer;
//# sourceMappingURL=timer.js.map
