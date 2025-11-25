/// <reference types="koa" />
import type { Strategy } from 'passport-local';
declare const _default: {
    init: () => import("koa").Middleware;
    getPassportStrategies: () => Strategy[];
    authEventsMapper: {
        onConnectionSuccess: string;
        onConnectionError: string;
    };
};
export default _default;
//# sourceMappingURL=passport.d.ts.map