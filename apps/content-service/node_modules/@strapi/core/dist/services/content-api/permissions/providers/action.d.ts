declare const _default: (options?: {}) => {
    register(action: string, payload: Record<string, unknown>): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
    hooks: import("@strapi/utils/dist/provider-factory").ProviderHooksMap;
    delete(key: string): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
    get(key: string): {
        [x: string]: unknown;
    } | undefined;
    values(): {
        [x: string]: unknown;
    }[];
    keys(): string[];
    has(key: string): boolean;
    size(): number;
    clear(): Promise<import("@strapi/utils/dist/provider-factory").Provider<{
        [x: string]: unknown;
    }>>;
};
export default _default;
//# sourceMappingURL=action.d.ts.map