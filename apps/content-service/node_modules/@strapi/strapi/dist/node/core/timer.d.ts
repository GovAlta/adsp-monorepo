export interface TimeMeasurer {
    start: (name: string) => void;
    end: (name: string) => number;
    getTimings: () => Record<string, number>;
}
export declare function getTimer(): TimeMeasurer;
export declare const prettyTime: (timeInMs: number) => string;
//# sourceMappingURL=timer.d.ts.map