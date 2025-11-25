'use strict';

var fp = require('lodash/fp');
var hooks = require('./hooks.js');

/**
 * Creates a new object containing various hooks used by the providers
 */ const createProviderHooksMap = ()=>({
        // Register events
        willRegister: hooks.createAsyncSeriesHook(),
        didRegister: hooks.createAsyncParallelHook(),
        // Delete events
        willDelete: hooks.createAsyncParallelHook(),
        didDelete: hooks.createAsyncParallelHook()
    });
/**
 * A Provider factory
 */ const providerFactory = (options = {})=>{
    const { throwOnDuplicates = true } = options;
    const state = {
        hooks: createProviderHooksMap(),
        registry: new Map()
    };
    return {
        hooks: state.hooks,
        async register (key, item) {
            if (throwOnDuplicates && this.has(key)) {
                throw new Error(`Duplicated item key: ${key}`);
            }
            await state.hooks.willRegister.call({
                key,
                value: item
            });
            state.registry.set(key, item);
            await state.hooks.didRegister.call({
                key,
                value: fp.cloneDeep(item)
            });
            return this;
        },
        async delete (key) {
            if (this.has(key)) {
                const item = this.get(key);
                await state.hooks.willDelete.call({
                    key,
                    value: fp.cloneDeep(item)
                });
                state.registry.delete(key);
                await state.hooks.didDelete.call({
                    key,
                    value: fp.cloneDeep(item)
                });
            }
            return this;
        },
        get (key) {
            return state.registry.get(key);
        },
        values () {
            return Array.from(state.registry.values());
        },
        keys () {
            return Array.from(state.registry.keys());
        },
        has (key) {
            return state.registry.has(key);
        },
        size () {
            return state.registry.size;
        },
        async clear () {
            const keys = this.keys();
            for (const key of keys){
                await this.delete(key);
            }
            return this;
        }
    };
};

module.exports = providerFactory;
//# sourceMappingURL=provider-factory.js.map
