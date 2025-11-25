declare const metrics: () => {
    sendDidInitializeEvent: () => Promise<void>;
    sendDidUpdateI18nLocalesEvent: () => Promise<void>;
};
type MetricsService = typeof metrics;
export default metrics;
export type { MetricsService };
//# sourceMappingURL=metrics.d.ts.map