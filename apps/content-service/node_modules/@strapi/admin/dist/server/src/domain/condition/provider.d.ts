import type { CreateConditionPayload } from '.';
/**
 * @typedef ConditionProviderOverride
 * @property {function(CreateConditionPayload)} register
 * @property {function(attributes CreateConditionPayload[]): Promise<this>} registerMany
 */
/**
 * Creates a new instance of a condition provider
 * @return {Provider & ConditionProviderOverride}
 */
declare const createConditionProvider: () => {
    register(conditionAttributes: CreateConditionPayload): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
    registerMany(conditionsAttributes: CreateConditionPayload[]): Promise<any>;
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
export default createConditionProvider;
//# sourceMappingURL=provider.d.ts.map