'use strict';

var fp = require('lodash/fp');
var utils = require('../utils.js');

var throwRestrictedFields = ((restrictedFields = null)=>({ key, path: { attribute: path } })=>{
        // all fields
        if (restrictedFields === null) {
            utils.throwInvalidKey({
                key,
                path
            });
        }
        // Throw on invalid formats
        if (!(fp.isArray(restrictedFields) && restrictedFields.every(fp.isString))) {
            throw new TypeError(`Expected array of strings for restrictedFields but got "${typeof restrictedFields}"`);
        }
        // if an exact match was found
        if (restrictedFields.includes(path)) {
            utils.throwInvalidKey({
                key,
                path
            });
        }
        // nested matches
        const isRestrictedNested = restrictedFields.some((allowedPath)=>path?.toString().startsWith(`${allowedPath}.`));
        if (isRestrictedNested) {
            utils.throwInvalidKey({
                key,
                path
            });
        }
    });

module.exports = throwRestrictedFields;
//# sourceMappingURL=throw-restricted-fields.js.map
