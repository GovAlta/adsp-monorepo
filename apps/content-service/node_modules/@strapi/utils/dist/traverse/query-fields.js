'use strict';

var fp = require('lodash/fp');
var factory = require('./factory.js');

const isStringArray = (value)=>{
    return fp.isArray(value) && value.every(fp.isString);
};
const fields = factory()// Intercept array of strings
// e.g. fields=['title', 'description']
.intercept(isStringArray, async (visitor, options, fields, { recurse })=>{
    return Promise.all(fields.map((field)=>recurse(visitor, options, field)));
})// Intercept comma separated fields (as string)
// e.g. fields='title,description'
.intercept((value)=>fp.isString(value) && value.includes(','), (visitor, options, fields, { recurse })=>{
    return Promise.all(fields.split(',').map((field)=>recurse(visitor, options, field)));
})// Return wildcards as is
.intercept((value)=>fp.eq('*', value), fp.constant('*'))// Parse string values
// Since we're parsing strings only, each value should be an attribute name (and it's value, undefined),
// thus it shouldn't be possible to set a new value, and get should return the whole data if key === data
.parse(fp.isString, ()=>({
        transform: fp.trim,
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
var traverseQueryFields = fp.curry(fields.traverse);

module.exports = traverseQueryFields;
//# sourceMappingURL=query-fields.js.map
