'use strict';

const registry = ()=>{
    const models = [];
    return {
        add (model) {
            models.push(model);
            return this;
        },
        get () {
            return models;
        }
    };
};

exports.registry = registry;
//# sourceMappingURL=models.js.map
