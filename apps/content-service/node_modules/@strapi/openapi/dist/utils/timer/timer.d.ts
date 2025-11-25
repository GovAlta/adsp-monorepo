export declare class Timer {
    private _startTime;
    private _endTime;
    private _elapsedTime;
    constructor();
    start(): number;
    stop(): {
        startTime: number;
        endTime: number;
        elapsedTime: number;
    };
    reset(): void;
}
//# sourceMappingURL=timer.d.ts.map