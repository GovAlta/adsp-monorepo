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

export { attributes, schema as default, info, options, pluginOptions };
//# sourceMappingURL=schema.json.mjs.map
