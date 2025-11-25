export declare const routes: {
    admin: {
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
    'content-api': () => {
        type: "content-api";
        routes: import("@strapi/types/dist/core").RouteInput[];
    };
    viewConfiguration: {
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