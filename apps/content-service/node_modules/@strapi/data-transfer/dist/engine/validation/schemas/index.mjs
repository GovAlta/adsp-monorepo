import { reject, isObject, isArray } from 'lodash/fp';
import 'crypto';
import 'stream';
import { diff } from '../../../utils/json.mjs';
import 'events';

const OPTIONAL_CONTENT_TYPES = [
    'audit-log'
];
const isAttributeIgnorable = (diff)=>{
    return diff.path.length === 3 && // Root property must be attributes
    diff.path[0] === 'attributes' && // Need a valid string attribute name
    typeof diff.path[1] === 'string' && // The diff must be on ignorable attribute properties
    [
        'private',
        'required',
        'configurable',
        'default'
    ].includes(diff.path[2]);
};
// TODO: clean up the type checking, which will require cleaning up the typings in utils/json.ts
// exclude admin tables that are not transferable and are optionally available (such as audit logs which are only available in EE)
const isOptionalAdminType = (diff)=>{
    // added/deleted
    if ('value' in diff && isObject(diff.value)) {
        const name = diff?.value?.info?.singularName;
        return OPTIONAL_CONTENT_TYPES.includes(name);
    }
    // modified
    if ('values' in diff && isArray(diff.values) && isObject(diff.values[0])) {
        const name = diff?.values[0]?.info?.singularName;
        return OPTIONAL_CONTENT_TYPES.includes(name);
    }
    return false;
};
const isIgnorableStrict = (diff)=>isAttributeIgnorable(diff) || isOptionalAdminType(diff);
const strategies = {
    // No diffs
    exact (diffs) {
        return diffs;
    },
    // Strict: all content types must match except:
    // - the property within a content type is an ignorable one
    // - those that are (not transferrable and optionally available), for example EE features such as audit logs
    strict (diffs) {
        return reject(isIgnorableStrict, diffs);
    }
};
const compareSchemas = (a, b, strategy)=>{
    const diffs = diff(a, b);
    return strategies[strategy](diffs);
};

export { compareSchemas };
//# sourceMappingURL=index.mjs.map
