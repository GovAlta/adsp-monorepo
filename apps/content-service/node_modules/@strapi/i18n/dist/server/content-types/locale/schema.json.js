'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var info = {
    singularName: "locale",
    pluralName: "locales",
    collectionName: "locales",
    displayName: "Locale",
    description: ""
};
var options = {};
var pluginOptions = {
    "content-manager": {
        visible: false
    },
    "content-type-builder": {
        visible: false
    }
};
var attributes = {
    name: {
        type: "string",
        min: 1,
        max: 50,
        configurable: false
    },
    code: {
        type: "string",
        unique: true,
        configurable: false
    }
};
var schema = {
    info: info,
    options: options,
    pluginOptions: pluginOptions,
    attributes: attributes
};

exports.attributes = attributes;
exports.default = schema;
exports.info = info;
exports.options = options;
exports.pluginOptions = pluginOptions;
//# sourceMappingURL=schema.json.js.map
