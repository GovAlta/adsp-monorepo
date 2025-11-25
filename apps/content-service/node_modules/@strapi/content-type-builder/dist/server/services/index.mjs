import * as contentTypes from './content-types.mjs';
import * as components from './components.mjs';
import * as componentCategories from './component-categories.mjs';
import * as builder from './builder.mjs';
import * as apiHandler from './api-handler.mjs';
import * as schema from './schema.mjs';

var services = {
    'content-types': contentTypes,
    components,
    'component-categories': componentCategories,
    builder,
    'api-handler': apiHandler,
    schema
};

export { services as default };
//# sourceMappingURL=index.mjs.map
