import { isArray, isString } from 'lodash/fp';
import { throwInvalidKey } from '../utils.mjs';

var throwRestrictedFields = ((restrictedFields = null)=>({ key, path: { attribute: path } })=>{
        // all fields
        if (restrictedFields === null) {
            throwInvalidKey({
                key,
                path
            });
        }
        // Throw on invalid formats
        if (!(isArray(restrictedFields) && restrictedFields.every(isString))) {
            throw new TypeError(`Expected array of strings for restrictedFields but got "${typeof restrictedFields}"`);
        }
        // if an exact match was found
        if (restrictedFields.includes(path)) {
            throwInvalidKey({
                key,
                path
            });
        }
        // nested matches
        const isRestrictedNested = restrictedFields.some((allowedPath)=>path?.toString().startsWith(`${allowedPath}.`));
        if (isRestrictedNested) {
            throwInvalidKey({
                key,
                path
            });
        }
    });

export { throwRestrictedFields as default };
//# sourceMappingURL=throw-restricted-fields.mjs.map
