'use strict';

require('./assemblers/document/info.js');
require('./assemblers/document/metadata.js');
require('./assemblers/document/path/path.js');
var document = require('./context/factories/document.js');
require('debug');
require('node:crypto');
require('zod/v4');
require('./assemblers/document/path/path-item/path-item.js');
require('./assemblers/document/path/path-item/operation/operation.js');
require('./assemblers/document/path/path-item/operation/operation-id.js');
require('./assemblers/document/path/path-item/operation/parameters.js');
require('./assemblers/document/path/path-item/operation/tags.js');
var factory$1 = require('./assemblers/document/factory.js');
var generator = require('./generator/generator.js');
var factory$2 = require('./post-processor/factory.js');
var factory = require('./pre-processor/factory.js');
var collector = require('./routes/collector.js');
var matcher = require('./routes/matcher.js');
var admin = require('./routes/providers/admin.js');
var api = require('./routes/providers/api.js');
var plugin = require('./routes/providers/plugin.js');
var isOfType = require('./routes/rules/is-of-type.js');

/**
 * Generates an in-memory OpenAPI specification for Strapi routes.
 *
 * @experimental
 *
 * @param strapi - The Strapi application instance.
 * @param options - Optional configuration for the generation process.
 * @param options.type - The type of routes to generate documentation for, either 'admin' or 'content-api'.
 *                       Defaults to 'content-api'.
 * @returns An object containing the generated OpenAPI document and other relevant outputs.
 *
 * @example
 * ```typescript
 * import { generate } from '@strapi/openapi';
 *
 * // Assuming 'strapi' is your Strapi instance
 * const output = generate(strapi, { type: 'content-api' });
 * console.log(output.document);
 * ```
 *
 * @example
 * ```typescript
 * import { generate } from '@strapi/openapi';
 *
 * // Generate documentation for all route types (default)
 * const output = generate(strapi);
 * console.log(output.document);
 * ```
 */ const generate = (strapi, options)=>{
    const { type = 'content-api' } = options ?? {};
    const config = {
        preProcessors: new factory.PreProcessorFactory().createAll(),
        assemblers: new factory$1.DocumentAssemblerFactory().createAll(),
        postProcessors: new factory$2.PostProcessorsFactory().createAll()
    };
    // Data sources for the Strapi routes
    const routeCollector = new collector.RouteCollector([
        new admin.AdminRoutesProvider(strapi),
        new api.ApiRoutesProvider(strapi),
        new plugin.PluginRoutesProvider(strapi)
    ], new matcher.RouteMatcher([
        // Only match content-api routes
        isOfType.isOfType(type)
    ]));
    const contextFactory = new document.DocumentContextFactory();
    const generator$1 = new generator.OpenAPIGenerator(config, strapi, routeCollector, contextFactory);
    return generator$1.generate();
};

exports.generate = generate;
//# sourceMappingURL=exports.js.map
