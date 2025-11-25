'use strict';

var slugify = require('@sindresorhus/slugify');

const nameToSlug = (name)=>slugify(name, {
        separator: '-'
    });

exports.nameToSlug = nameToSlug;
//# sourceMappingURL=nameToSlug.js.map
