'use strict';

var _ = require('lodash');
var fp = require('lodash/fp');
var slugify = require('@sindresorhus/slugify');

const nameToSlug = (name, options = {
    separator: '-'
})=>slugify(name, options);
const nameToCollectionName = (name)=>slugify(name, {
        separator: '_'
    });
const toRegressedEnumValue = (value)=>slugify(value, {
        decamelize: false,
        lowercase: false,
        separator: '_'
    });
const getCommonPath = (...paths)=>{
    const [segments, ...otherSegments] = paths.map((it)=>_.split(it, '/'));
    return _.join(_.takeWhile(segments, (str, index)=>otherSegments.every((it)=>it[index] === str)), '/');
};
const isEqual = (a, b)=>String(a) === String(b);
const isCamelCase = (value)=>/^[a-z][a-zA-Z0-9]+$/.test(value);
const isKebabCase = (value)=>/^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/.test(value);
const startsWithANumber = (value)=>/^[0-9]/.test(value);
const joinBy = (joint, ...args)=>{
    const trim = fp.trimChars(joint);
    const trimEnd = fp.trimCharsEnd(joint);
    const trimStart = fp.trimCharsStart(joint);
    return args.reduce((url, path, index)=>{
        if (args.length === 1) return path;
        if (index === 0) return trimEnd(path);
        if (index === args.length - 1) return url + joint + trimStart(path);
        return url + joint + trim(path);
    }, '');
};
const toKebabCase = (value)=>_.kebabCase(value);

exports.getCommonPath = getCommonPath;
exports.isCamelCase = isCamelCase;
exports.isEqual = isEqual;
exports.isKebabCase = isKebabCase;
exports.joinBy = joinBy;
exports.nameToCollectionName = nameToCollectionName;
exports.nameToSlug = nameToSlug;
exports.startsWithANumber = startsWithANumber;
exports.toKebabCase = toKebabCase;
exports.toRegressedEnumValue = toRegressedEnumValue;
//# sourceMappingURL=strings.js.map
