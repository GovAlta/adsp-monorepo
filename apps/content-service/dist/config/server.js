"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ env }) => ({
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 3333),
    app: {
        keys: env.array('APP_KEYS'),
    },
    logger: { config: { level: env('LOG_LEVEL', 'debug') } },
});
//# sourceMappingURL=server.js.map