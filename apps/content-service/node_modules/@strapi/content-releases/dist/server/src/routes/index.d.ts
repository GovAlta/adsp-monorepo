export declare const routes: {
    homepage: import("@strapi/types/dist/core").Router;
    settings: {
        type: string;
        routes: {
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
            };
        }[];
    };
    release: {
        type: string;
        routes: {
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
            };
        }[];
    };
    'release-action': {
        type: string;
        routes: {
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
            };
        }[];
    };
};
//# sourceMappingURL=index.d.ts.map