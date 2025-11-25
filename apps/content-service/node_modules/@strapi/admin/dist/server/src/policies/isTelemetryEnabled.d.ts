/**
 * This policy is used for routes dealing with telemetry and analytics content.
 * It will fails when the telemetry has been disabled on the server.
 */
declare const _default: {
    name: string;
    validator: (config: unknown) => void;
    handler: (...args: any[]) => any;
};
export default _default;
//# sourceMappingURL=isTelemetryEnabled.d.ts.map