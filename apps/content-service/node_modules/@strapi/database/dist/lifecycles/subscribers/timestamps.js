'use strict';

var _ = require('lodash');

// NOTE: we could add onCreate & onUpdate on field level to do this instead
const timestampsLifecyclesSubscriber = {
    /**
   * Init createdAt & updatedAt before create
   */ beforeCreate (event) {
        const { data } = event.params;
        const now = new Date();
        _.defaults(data, {
            createdAt: now,
            updatedAt: now
        });
    },
    /**
   * Init createdAt & updatedAt before create
   * @param {Event} event
   */ beforeCreateMany (event) {
        const { data } = event.params;
        const now = new Date();
        if (_.isArray(data)) {
            data.forEach((data)=>_.defaults(data, {
                    createdAt: now,
                    updatedAt: now
                }));
        }
    },
    /**
   * Update updatedAt before update
   * @param {Event} event
   */ beforeUpdate (event) {
        const { data } = event.params;
        const now = new Date();
        _.assign(data, {
            updatedAt: now
        });
    },
    /**
   * Update updatedAt before update
   * @param {Event} event
   */ beforeUpdateMany (event) {
        const { data } = event.params;
        const now = new Date();
        if (_.isArray(data)) {
            data.forEach((data)=>_.assign(data, {
                    updatedAt: now
                }));
        }
    }
};

exports.timestampsLifecyclesSubscriber = timestampsLifecyclesSubscriber;
//# sourceMappingURL=timestamps.js.map
