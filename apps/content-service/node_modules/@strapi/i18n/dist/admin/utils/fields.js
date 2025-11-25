'use strict';

var has = require('lodash/has');

const LOCALIZED_FIELDS = [
    'biginteger',
    'boolean',
    'component',
    'date',
    'datetime',
    'decimal',
    'dynamiczone',
    'email',
    'enumeration',
    'float',
    'integer',
    'json',
    'media',
    'number',
    'password',
    'richtext',
    'blocks',
    'string',
    'text',
    'time'
];
const doesPluginOptionsHaveI18nLocalized = (opts)=>has(opts, [
        'i18n',
        'localized'
    ]);

exports.LOCALIZED_FIELDS = LOCALIZED_FIELDS;
exports.doesPluginOptionsHaveI18nLocalized = doesPluginOptionsHaveI18nLocalized;
//# sourceMappingURL=fields.js.map
