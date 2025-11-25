'use strict';

var fp = require('lodash/fp');
var factory = require('./factory.js');
var contentTypes = require('../content-types.js');

const isKeyword = (keyword)=>{
    return ({ key, attribute })=>{
        return !attribute && keyword === key;
    };
};
const isWildcard = (value)=>value === '*';
const isPopulateString = (value)=>{
    return fp.isString(value) && !isWildcard(value);
};
const isStringArray = (value)=>fp.isArray(value) && value.every(fp.isString);
const isObj = (value)=>fp.isObject(value);
const populate = factory().intercept(isPopulateString, async (visitor, options, populate, { recurse })=>{
    /**
     * Ensure the populate clause its in the extended format ( { populate: { ... } }, and not just a string)
     * This gives a consistent structure to track the "parent" node of each nested populate clause
     */ const populateObject = pathsToObjectPopulate([
        populate
    ]);
    const traversedPopulate = await recurse(visitor, options, populateObject);
    const [result] = objectPopulateToPaths(traversedPopulate);
    return result;
})// Array of strings ['foo', 'bar.baz'] => map(recurse), then filter out empty items
.intercept(isStringArray, async (visitor, options, populate, { recurse })=>{
    const paths = await Promise.all(populate.map((subClause)=>recurse(visitor, options, subClause)));
    return paths.filter((item)=>!fp.isNil(item));
})// for wildcard, generate custom utilities to modify the values
.parse(isWildcard, ()=>({
        /**
     * Since value is '*', we don't need to transform it
     */ transform: fp.identity,
        /**
     * '*' isn't a key/value structure, so regardless
     *  of the given key, it returns the data ('*')
     */ get: (_key, data)=>data,
        /**
     * '*' isn't a key/value structure, so regardless
     * of the given `key`, use `value` as the new `data`
     */ set: (_key, value)=>value,
        /**
     * '*' isn't a key/value structure, but we need to simulate at least one to enable
     * the data traversal. We're using '' since it represents a falsy string value
     */ keys: fp.constant([
            ''
        ]),
        /**
     * Removing '*' means setting it to undefined, regardless of the given key
     */ remove: fp.constant(undefined)
    }))// Parse string values
.parse(fp.isString, ()=>{
    const tokenize = fp.split('.');
    const recompose = fp.join('.');
    return {
        transform: fp.trim,
        remove (key, data) {
            const [root] = tokenize(data);
            return root === key ? undefined : data;
        },
        set (key, value, data) {
            const [root] = tokenize(data);
            if (root !== key) {
                return data;
            }
            return fp.isNil(value) || fp.isEmpty(value) ? root : `${root}.${value}`;
        },
        keys (data) {
            const v = fp.first(tokenize(data));
            return v ? [
                v
            ] : [];
        },
        get (key, data) {
            const [root, ...rest] = tokenize(data);
            return key === root ? recompose(rest) : undefined;
        }
    };
})// Parse object values
.parse(isObj, ()=>({
        transform: fp.cloneDeep,
        remove (key, data) {
            // eslint-disable-next-line no-unused-vars
            const { [key]: ignored, ...rest } = data;
            return rest;
        },
        set (key, value, data) {
            return {
                ...data,
                [key]: value
            };
        },
        keys (data) {
            return Object.keys(data);
        },
        get (key, data) {
            return data[key];
        }
    })).ignore(({ key, attribute })=>{
    // we don't want to recurse using traversePopulate and instead let
    // the visitors recurse with the appropriate traversal (sort, filters, etc...)
    return [
        'sort',
        'filters',
        'fields'
    ].includes(key) && !attribute;
}).on(// Handle recursion on populate."populate"
isKeyword('populate'), async ({ key, visitor, path, value, schema, getModel, attribute }, { set, recurse })=>{
    const parent = {
        key,
        path,
        schema,
        attribute
    };
    const newValue = await recurse(visitor, {
        schema,
        path,
        getModel,
        parent
    }, value);
    set(key, newValue);
}).on(isKeyword('on'), async ({ key, visitor, path, value, getModel, parent }, { set, recurse })=>{
    const newOn = {};
    if (!isObj(value)) {
        return;
    }
    for (const [uid, subPopulate] of Object.entries(value)){
        const model = getModel(uid);
        const newPath = {
            ...path,
            raw: `${path.raw}[${uid}]`
        };
        newOn[uid] = await recurse(visitor, {
            schema: model,
            path: newPath,
            getModel,
            parent
        }, subPopulate);
    }
    set(key, newOn);
})// Handle populate on relation
.onRelation(async ({ key, value, attribute, visitor, path, schema, getModel }, { set, recurse })=>{
    if (fp.isNil(value)) {
        return;
    }
    const parent = {
        key,
        path,
        schema,
        attribute
    };
    if (contentTypes.isMorphToRelationalAttribute(attribute)) {
        // Don't traverse values that cannot be parsed
        if (!fp.isObject(value) || !('on' in value && fp.isObject(value?.on))) {
            return;
        }
        // If there is a populate fragment defined, traverse it
        const newValue = await recurse(visitor, {
            schema,
            path,
            getModel,
            parent
        }, {
            on: value?.on
        });
        set(key, newValue);
        return;
    }
    const targetSchemaUID = attribute.target;
    const targetSchema = getModel(targetSchemaUID);
    const newValue = await recurse(visitor, {
        schema: targetSchema,
        path,
        getModel,
        parent
    }, value);
    set(key, newValue);
})// Handle populate on media
.onMedia(async ({ key, path, schema, attribute, visitor, value, getModel }, { recurse, set })=>{
    if (fp.isNil(value)) {
        return;
    }
    const parent = {
        key,
        path,
        schema,
        attribute
    };
    const targetSchemaUID = 'plugin::upload.file';
    const targetSchema = getModel(targetSchemaUID);
    const newValue = await recurse(visitor, {
        schema: targetSchema,
        path,
        getModel,
        parent
    }, value);
    set(key, newValue);
})// Handle populate on components
.onComponent(async ({ key, value, schema, visitor, path, attribute, getModel }, { recurse, set })=>{
    if (fp.isNil(value)) {
        return;
    }
    const parent = {
        key,
        path,
        schema,
        attribute
    };
    const targetSchema = getModel(attribute.component);
    const newValue = await recurse(visitor, {
        schema: targetSchema,
        path,
        getModel,
        parent
    }, value);
    set(key, newValue);
})// Handle populate on dynamic zones
.onDynamicZone(async ({ key, value, schema, visitor, path, attribute, getModel }, { set, recurse })=>{
    if (fp.isNil(value) || !fp.isObject(value)) {
        return;
    }
    const parent = {
        key,
        path,
        schema,
        attribute
    };
    // Handle fragment syntax
    if ('on' in value && value.on) {
        const newOn = await recurse(visitor, {
            schema,
            path,
            getModel,
            parent
        }, {
            on: value.on
        });
        set(key, newOn);
    }
});
var traverseQueryPopulate = fp.curry(populate.traverse);
const objectPopulateToPaths = (input)=>{
    const paths = [];
    function traverse(currentObj, parentPath) {
        for (const [key, value] of Object.entries(currentObj)){
            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            if (value === true) {
                paths.push(currentPath);
            } else {
                traverse(value.populate, currentPath);
            }
        }
    }
    traverse(input, '');
    return paths;
};
const pathsToObjectPopulate = (input)=>{
    const result = {};
    function traverse(object, keys) {
        const [first, ...rest] = keys;
        if (rest.length === 0) {
            object[first] = true;
        } else {
            if (!object[first] || typeof object[first] === 'boolean') {
                object[first] = {
                    populate: {}
                };
            }
            traverse(object[first].populate, rest);
        }
    }
    input.forEach((clause)=>traverse(result, clause.split('.')));
    return result;
};

module.exports = traverseQueryPopulate;
//# sourceMappingURL=query-populate.js.map
