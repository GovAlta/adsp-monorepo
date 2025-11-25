'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');

/**
 * We use this component to wrap any individual component field in the Edit View,
 * this could be a component field in a dynamic zone, a component within a repeatable space,
 * or even nested components.
 *
 * We primarily need this to provide the component id to the components so that they can
 * correctly fetch their relations.
 */ const [ComponentProvider, useComponent] = strapiAdmin.createContext('ComponentContext', {
    id: undefined,
    level: -1,
    uid: undefined,
    type: undefined
});

exports.ComponentProvider = ComponentProvider;
exports.useComponent = useComponent;
//# sourceMappingURL=ComponentContext.js.map
