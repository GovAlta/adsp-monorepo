/// <reference types="lodash" />
export declare const getAdminStore: () => Promise<{
    get(params?: Partial<{
        key: string;
        type?: string | undefined;
        environment?: string | undefined;
        name?: string | undefined;
        tag?: string | undefined;
    }> | undefined): Promise<unknown>;
    set(params?: Partial<{
        key: string;
        value: unknown;
        type?: string | undefined;
        environment?: string | undefined;
        name?: string | undefined;
        tag?: string | undefined;
    }> | undefined): Promise<void>;
    delete(params?: Partial<{
        key: string;
        type?: string | undefined;
        environment?: string | undefined;
        name?: string | undefined;
        tag?: string | undefined;
    }> | undefined): Promise<void>;
}>;
export declare const getPrefixedRedirectUrls: () => import("lodash").Dictionary<string>;
declare const _default: {
    getAdminStore: () => Promise<{
        get(params?: Partial<{
            key: string;
            type?: string | undefined;
            environment?: string | undefined;
            name?: string | undefined;
            tag?: string | undefined;
        }> | undefined): Promise<unknown>;
        set(params?: Partial<{
            key: string;
            value: unknown;
            type?: string | undefined;
            environment?: string | undefined;
            name?: string | undefined;
            tag?: string | undefined;
        }> | undefined): Promise<void>;
        delete(params?: Partial<{
            key: string;
            type?: string | undefined;
            environment?: string | undefined;
            name?: string | undefined;
            tag?: string | undefined;
        }> | undefined): Promise<void>;
    }>;
    getPrefixedRedirectUrls: () => import("lodash").Dictionary<string>;
};
export default _default;
//# sourceMappingURL=utils.d.ts.map