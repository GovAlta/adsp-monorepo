'use strict';

require('../constants/index.js');
var isoLocales = require('../constants/iso-locales.json.js');

const getIsoLocales = ()=>isoLocales;
const isoLocalesService = ()=>({
        getIsoLocales
    });

module.exports = isoLocalesService;
//# sourceMappingURL=iso-locales.js.map
