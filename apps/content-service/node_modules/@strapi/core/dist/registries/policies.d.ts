/// <reference types="lodash" />
import type { Core } from '@strapi/types';
interface PolicyInfo {
    name: string;
    config: unknown;
}
type PolicyConfig = string | PolicyInfo;
interface NamespaceInfo {
    pluginName?: string;
    apiName?: string;
}
declare const policiesRegistry: () => {
    /**
     * Returns this list of registered policies uids
     */
    keys(): string[];
    /**
     * Returns the instance of a policy. Instantiate the policy if not already done
     */
    get(name: string, namespaceInfo?: NamespaceInfo): Core.Policy<unknown> | undefined;
    /**
     * Checks if a policy is registered
     */
    has(name: string, namespaceInfo?: NamespaceInfo): boolean;
    /**
     * Returns a map with all the policies in a namespace
     */
    getAll(namespace: string): import("lodash").Dictionary<unknown>;
    /**
     * Registers a policy
     */
    set(uid: string, policy: Core.Policy): any;
    /**
     * Registers a map of policies for a specific namespace
     */
    add(namespace: string, newPolicies: Record<string, Core.Policy>): void;
    /**
     * Resolves a list of policies
     */
    resolve(config: PolicyConfig | PolicyConfig[], namespaceInfo?: NamespaceInfo): {
        handler: Core.Policy<unknown>;
        config: {};
    }[];
};
export default policiesRegistry;
//# sourceMappingURL=policies.d.ts.map