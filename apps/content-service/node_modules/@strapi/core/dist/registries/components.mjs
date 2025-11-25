import { has } from 'lodash/fp';

const componentsRegistry = ()=>{
    const components = {};
    return {
        /**
     * Returns this list of registered components uids
     */ keys () {
            return Object.keys(components);
        },
        /**
     * Returns the instance of a component. Instantiate the component if not already done
     */ get (uid) {
            return components[uid];
        },
        /**
     * Returns a map with all the components in a namespace
     */ getAll () {
            return components;
        },
        /**
     * Registers a component
     */ set (uid, component) {
            if (has(uid, components)) {
                throw new Error(`Component ${uid} has already been registered.`);
            }
            components[uid] = component;
            return this;
        },
        /**
     * Registers a map of components for a specific namespace
     */ add (newComponents) {
            for (const uid of Object.keys(newComponents)){
                this.set(uid, newComponents[uid]);
            }
        }
    };
};

export { componentsRegistry as default };
//# sourceMappingURL=components.mjs.map
