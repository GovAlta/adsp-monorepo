import ___default from 'lodash';
import { rulesToQuery } from '@casl/ability/extra';

// TODO: migration
const operatorsMap = {
    $in: '$in',
    $nin: '$notIn',
    $exists: '$notNull',
    $gte: '$gte',
    $gt: '$gt',
    $lte: '$lte',
    $lt: '$lt',
    $eq: '$eq',
    $ne: '$ne',
    $and: '$and',
    $or: '$or',
    $not: '$not'
};
const mapKey = (key)=>{
    if (___default.isString(key) && key.startsWith('$') && key in operatorsMap) {
        return operatorsMap[key];
    }
    return key;
};
const buildCaslQuery = (ability, action, model)=>{
    // @ts-expect-error casl types
    return rulesToQuery(ability, action, model, (o)=>o.conditions);
};
const buildStrapiQuery = (caslQuery)=>{
    return unwrapDeep(caslQuery);
};
const unwrapDeep = (obj)=>{
    if (!___default.isPlainObject(obj) && !___default.isArray(obj)) {
        return obj;
    }
    if (___default.isArray(obj)) {
        return obj.map((v)=>unwrapDeep(v));
    }
    return ___default.reduce(obj, (acc, v, k)=>{
        const key = mapKey(k);
        if (___default.isPlainObject(v)) {
            if ('$elemMatch' in v) {
                ___default.setWith(acc, key, unwrapDeep(v.$elemMatch));
            } else {
                ___default.setWith(acc, key, unwrapDeep(v));
            }
        } else if (___default.isArray(v)) {
            // prettier-ignore
            ___default.setWith(acc, key, v.map((v)=>unwrapDeep(v)));
        } else {
            ___default.setWith(acc, key, v);
        }
        return acc;
    }, {});
};

export { buildCaslQuery, buildStrapiQuery };
//# sourceMappingURL=query-builders.mjs.map
