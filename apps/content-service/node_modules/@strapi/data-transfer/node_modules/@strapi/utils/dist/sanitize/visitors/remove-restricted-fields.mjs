import { isArray, isString } from 'lodash/fp';

var removeRestrictedFields = ((restrictedFields = null)=>({ key, path: { attribute: path } }, { remove })=>{
        // Remove all fields
        if (restrictedFields === null) {
            remove(key);
            return;
        }
        // Throw on invalid formats
        if (!(isArray(restrictedFields) && restrictedFields.every(isString))) {
            throw new TypeError(`Expected array of strings for restrictedFields but got "${typeof restrictedFields}"`);
        }
        // Remove if an exact match was found
        if (restrictedFields.includes(path)) {
            remove(key);
            return;
        }
        // Remove nested matches
        const isRestrictedNested = restrictedFields.some((allowedPath)=>path?.toString().startsWith(`${allowedPath}.`));
        if (isRestrictedNested) {
            remove(key);
        }
    });

export { removeRestrictedFields as default };
//# sourceMappingURL=remove-restricted-fields.mjs.map
