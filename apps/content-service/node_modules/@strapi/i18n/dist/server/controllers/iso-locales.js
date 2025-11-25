'use strict';

var index = require('../utils/index.js');

const controller = {
    listIsoLocales (ctx) {
        const isoLocalesService = index.getService('iso-locales');
        ctx.body = isoLocalesService.getIsoLocales();
    }
};

module.exports = controller;
//# sourceMappingURL=iso-locales.js.map
