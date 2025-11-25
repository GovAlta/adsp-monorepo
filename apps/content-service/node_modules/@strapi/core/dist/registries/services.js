'use strict';

var fp = require('lodash/fp');
var namespace = require('./namespace.js');

const servicesRegistry = (strapi)=>{
    const services = {};
    const instantiatedServices = {};
    return {
        /**
     * Returns this list of registered services uids
     */ keys () {
            return Object.keys(services);
        },
        /**
     * Returns the instance of a service. Instantiate the service if not already done
     */ get (uid) {
            if (instantiatedServices[uid]) {
                return instantiatedServices[uid];
            }
            const service = services[uid];
            if (service) {
                instantiatedServices[uid] = typeof service === 'function' ? service({
                    strapi
                }) : service;
                return instantiatedServices[uid];
            }
        },
        /**
     * Returns a map with all the services in a namespace
     */ getAll (namespace$1) {
            const filteredServices = fp.pickBy((_, uid)=>namespace.hasNamespace(uid, namespace$1))(services);
            // create lazy accessor to avoid instantiating the services;
            const map = {};
            for (const uid of Object.keys(filteredServices)){
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
     * Registers a service
     */ set (uid, service) {
            services[uid] = service;
            delete instantiatedServices[uid];
            return this;
        },
        /**
     * Registers a map of services for a specific namespace
     */ add (namespace$1, newServices) {
            for (const serviceName of Object.keys(newServices)){
                const service = newServices[serviceName];
                const uid = namespace.addNamespace(serviceName, namespace$1);
                if (fp.has(uid, services)) {
                    throw new Error(`Service ${uid} has already been registered.`);
                }
                services[uid] = service;
            }
            return this;
        },
        /**
     * Wraps a service to extend it
     */ extend (uid, extendFn) {
            const currentService = this.get(uid);
            if (!currentService) {
                throw new Error(`Service ${uid} doesn't exist`);
            }
            const newService = extendFn(currentService);
            instantiatedServices[uid] = newService;
            return this;
        }
    };
};

module.exports = servicesRegistry;
//# sourceMappingURL=services.js.map
