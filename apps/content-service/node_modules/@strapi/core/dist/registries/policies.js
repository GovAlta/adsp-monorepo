'use strict';

var fp = require('lodash/fp');
var namespace = require('./namespace.js');

const PLUGIN_PREFIX = 'plugin::';
const API_PREFIX = 'api::';
const parsePolicy = (policy)=>{
    if (typeof policy === 'string') {
        return {
            policyName: policy,
            config: {}
        };
    }
    const { name, config } = policy;
    return {
        policyName: name,
        config
    };
};
const policiesRegistry = ()=>{
    const policies = new Map();
    const find = (name, namespaceInfo)=>{
        const { pluginName, apiName } = namespaceInfo ?? {};
        // try to resolve a full name to avoid extra prefixing
        const policy = policies.get(name);
        if (policy) {
            return policy;
        }
        if (pluginName) {
            return policies.get(`${PLUGIN_PREFIX}${pluginName}.${name}`);
        }
        if (apiName) {
            return policies.get(`${API_PREFIX}${apiName}.${name}`);
        }
    };
    function resolveHandler(policyConfig, namespaceInfo) {
        if (Array.isArray(policyConfig)) {
            return policyConfig.map((config)=>{
                return resolveHandler(config, namespaceInfo);
            });
        }
        const { policyName, config } = parsePolicy(policyConfig);
        const policy = find(policyName, namespaceInfo);
        if (!policy) {
            throw new Error(`Policy ${policyName} not found.`);
        }
        if (typeof policy === 'function') {
            return policy;
        }
        if (policy.validator) {
            policy.validator(config);
        }
        return policy.handler;
    }
    return {
        /**
     * Returns this list of registered policies uids
     */ keys () {
            // Return an array so format stays the same as controllers, services, etc
            return Array.from(policies.keys());
        },
        /**
     * Returns the instance of a policy. Instantiate the policy if not already done
     */ get (name, namespaceInfo) {
            return find(name, namespaceInfo);
        },
        /**
     * Checks if a policy is registered
     */ has (name, namespaceInfo) {
            const res = find(name, namespaceInfo);
            return !!res;
        },
        /**
     * Returns a map with all the policies in a namespace
     */ getAll (namespace$1) {
            return fp.pickBy((_, uid)=>namespace.hasNamespace(uid, namespace$1))(Object.fromEntries(policies));
        },
        /**
     * Registers a policy
     */ set (uid, policy) {
            policies.set(uid, policy);
            return this;
        },
        /**
     * Registers a map of policies for a specific namespace
     */ add (namespace$1, newPolicies) {
            for (const policyName of Object.keys(newPolicies)){
                const policy = newPolicies[policyName];
                const uid = namespace.addNamespace(policyName, namespace$1);
                if (fp.has(uid, policies)) {
                    throw new Error(`Policy ${uid} has already been registered.`);
                }
                policies.set(uid, policy);
            }
        },
        /**
     * Resolves a list of policies
     */ resolve (config, namespaceInfo) {
            const { pluginName, apiName } = namespaceInfo ?? {};
            return fp.castArray(config).map((policyConfig)=>{
                return {
                    handler: resolveHandler(policyConfig, {
                        pluginName,
                        apiName
                    }),
                    config: typeof policyConfig === 'object' && policyConfig.config || {}
                };
            });
        }
    };
};

module.exports = policiesRegistry;
//# sourceMappingURL=policies.js.map
