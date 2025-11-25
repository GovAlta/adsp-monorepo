import { pickBy, has } from 'lodash/fp';
import { hasNamespace, addNamespace } from './namespace.mjs';

const controllersRegistry = (strapi)=>{
    const controllers = {};
    const instances = {};
    return {
        /**
     * Returns this list of registered controllers uids
     */ keys () {
            return Object.keys(controllers);
        },
        /**
     * Returns the instance of a controller. Instantiate the controller if not already done
     */ get (uid) {
            if (instances[uid]) {
                return instances[uid];
            }
            const controller = controllers[uid];
            if (controller) {
                instances[uid] = typeof controller === 'function' ? controller({
                    strapi
                }) : controller;
                return instances[uid];
            }
        },
        /**
     * Returns a map with all the controller in a namespace
     */ getAll (namespace) {
            const filteredControllers = pickBy((_, uid)=>hasNamespace(uid, namespace))(controllers);
            const map = {};
            for (const uid of Object.keys(filteredControllers)){
                Object.defineProperty(map, uid, {
                    enumerable: true,
                    get: ()=>{
                        return this.get(uid);
                    }
                });
            }
            return map;
        },
        /**
     * Registers a controller
     */ set (uid, value) {
            controllers[uid] = value;
            delete instances[uid];
            return this;
        },
        /**
     * Registers a map of controllers for a specific namespace
     */ add (namespace, newControllers) {
            for (const controllerName of Object.keys(newControllers)){
                const controller = newControllers[controllerName];
                const uid = addNamespace(controllerName, namespace);
                if (has(uid, controllers)) {
                    throw new Error(`Controller ${uid} has already been registered.`);
                }
                controllers[uid] = controller;
            }
            return this;
        },
        /**
     * Wraps a controller to extend it
     */ extend (controllerUID, extendFn) {
            const currentController = this.get(controllerUID);
            if (!currentController) {
                throw new Error(`Controller ${controllerUID} doesn't exist`);
            }
            const newController = extendFn(currentController);
            instances[controllerUID] = newController;
            return this;
        }
    };
};

export { controllersRegistry as default };
//# sourceMappingURL=controllers.mjs.map
