'use strict';

const formatLocale = (locale)=>{
    return {
        ...locale,
        name: locale.name || null
    };
};

exports.formatLocale = formatLocale;
//# sourceMappingURL=locale.js.map
