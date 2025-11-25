'use strict';

var index = require('../utils/index.js');

var init = {
    getInitData (ctx) {
        const { toDto } = index.getService('data-mapper');
        const { findAllComponents } = index.getService('components');
        const { getAllFieldSizes } = index.getService('field-sizes');
        const { findAllContentTypes } = index.getService('content-types');
        ctx.body = {
            data: {
                fieldSizes: getAllFieldSizes(),
                components: findAllComponents().map(toDto),
                contentTypes: findAllContentTypes().map(toDto)
            }
        };
    }
};

module.exports = init;
//# sourceMappingURL=init.js.map
