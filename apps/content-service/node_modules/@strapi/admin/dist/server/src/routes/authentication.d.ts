declare const _default: ({
    method: string;
    path: string;
    handler: string;
    config: {
        auth: boolean;
        middlewares: string[];
        policies?: undefined;
    };
} | {
    method: string;
    path: string;
    handler: string;
    config: {
        auth: boolean;
        middlewares?: undefined;
        policies?: undefined;
    };
} | {
    method: string;
    path: string;
    handler: string;
    config: {
        policies: string[];
        auth?: undefined;
        middlewares?: undefined;
    };
})[];
export default _default;
//# sourceMappingURL=authentication.d.ts.map