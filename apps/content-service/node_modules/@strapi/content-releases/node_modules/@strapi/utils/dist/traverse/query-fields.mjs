import { isString, eq, constant, trim, curry, isArray } from 'lodash/fp';
import traverseFactory from './factory.mjs';

const isStringArray = (value)=>{
    return isArray(value) && value.every(isString);
};
const fields = traverseFactory()// Intercept array of strings
// e.g. fields=['title', 'description']
.intercept(isStringArray, async (visitor, options, fields, { recurse })=>{
    return Promise.all(fields.map((field)=>recurse(visitor, options, field)));
})// Intercept comma separated fields (as string)
// e.g. fields='title,description'
.intercept((value)=>isString(value) && value.includes(','), (visitor, options, fields, { recurse })=>{
    return Promise.all(fields.split(',').map((field)=>recurse(visitor, options, field)));
})// Return wildcards as is
.intercept((value)=>eq('*', value), constant('*'))// Parse string values
// Since we're parsing strings only, each value should be an attribute name (and it's value, undefined),
// thus it shouldn't be possible to set a new value, and get should return the whole data if key === data
.parse(isString, ()=>({
        transform: trim,
        remove (key, data) {
            return data === key ? undefined : data;
        },
        set (_key, _value, data) {
            return data;
        },
        keys (data) {
            return [
                data
            ];
        },
        get (key, data) {
            return key === data ? data : undefined;
        }
    }));
var traverseQueryFields = curry(fields.traverse);

export { traverseQueryFields as default };
//# sourceMappingURL=query-fields.mjs.map
