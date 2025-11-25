'use strict';

class Container {
    add(name, resolver) {
        if (this.registerMap.has(name)) {
            throw new Error(`Cannot register already registered service ${name}`);
        }
        this.registerMap.set(name, resolver);
        return this;
    }
    get(name, args) {
        // TODO: handle singleton vs instantiation everytime
        if (this.serviceMap.has(name)) {
            return this.serviceMap.get(name);
        }
        if (this.registerMap.has(name)) {
            const resolver = this.registerMap.get(name);
            if (typeof resolver === 'function') {
                this.serviceMap.set(name, resolver(this, args));
            } else {
                this.serviceMap.set(name, resolver);
            }
            return this.serviceMap.get(name);
        }
        throw new Error(`Could not resolve service ${name}`);
    }
    constructor(){
        this.registerMap = new Map();
        this.serviceMap = new Map();
    }
}

exports.Container = Container;
//# sourceMappingURL=container.js.map
