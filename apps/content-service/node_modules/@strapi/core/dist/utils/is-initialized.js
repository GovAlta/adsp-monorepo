'use strict';

var fp = require('lodash/fp');

/**
 * Test if the strapi application is considered as initialized (1st user has been created)
 */ const isInitialized = async (strapi)=>{
    try {
        if (fp.isEmpty(strapi.admin)) {
            return true;
        }
        // test if there is at least one admin
        const anyAdministrator = await strapi.db.query('admin::user').findOne({
            select: [
                'id'
            ]
        });
        return !fp.isNil(anyAdministrator);
    } catch (err) {
        strapi.stopWithError(err);
    }
};

exports.isInitialized = isInitialized;
//# sourceMappingURL=is-initialized.js.map
