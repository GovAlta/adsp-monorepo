declare const _default: ({
    method: string;
    path: string;
    handler: string;
    config: {
        auth: boolean;
        policies?: undefined;
    };
} | {
    method: string;
    path: string;
    handler: string;
    config: {
        policies: (string | {
            name: string;
            config: {
                actions: string[];
            };
        })[];
        auth?: undefined;
    };
})[];
export default _default;
//# sourceMappingURL=admin.d.ts.map