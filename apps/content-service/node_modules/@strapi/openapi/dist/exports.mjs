import './assemblers/document/info.mjs';
import './assemblers/document/metadata.mjs';
import './assemblers/document/path/path.mjs';
import { DocumentContextFactory } from './context/factories/document.mjs';
import 'debug';
import 'node:crypto';
import 'zod/v4';
import './assemblers/document/path/path-item/path-item.mjs';
import './assemblers/document/path/path-item/operation/operation.mjs';
import './assemblers/document/path/path-item/operation/operation-id.mjs';
import './assemblers/document/path/path-item/operation/parameters.mjs';
import './assemblers/document/path/path-item/operation/tags.mjs';
import { DocumentAssemblerFactory } from './assemblers/document/factory.mjs';
import { OpenAPIGenerator } from './generator/generator.mjs';
import { PostProcessorsFactory } from './post-processor/factory.mjs';
import { PreProcessorFactory } from './pre-processor/factory.mjs';
import { RouteCollector } from './routes/collector.mjs';
import { RouteMatcher } from './routes/matcher.mjs';
import { AdminRoutesProvider } from './routes/providers/admin.mjs';
import { ApiRoutesProvider } from './routes/providers/api.mjs';
import { PluginRoutesProvider } from './routes/providers/plugin.mjs';
import { isOfType } from './routes/rules/is-of-type.mjs';

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
        preProcessors: new PreProcessorFactory().createAll(),
        assemblers: new DocumentAssemblerFactory().createAll(),
        postProcessors: new PostProcessorsFactory().createAll()
    };
    // Data sources for the Strapi routes
    const routeCollector = new RouteCollector([
        new AdminRoutesProvider(strapi),
        new ApiRoutesProvider(strapi),
        new PluginRoutesProvider(strapi)
    ], new RouteMatcher([
        // Only match content-api routes
        isOfType(type)
    ]));
    const contextFactory = new DocumentContextFactory();
    const generator = new OpenAPIGenerator(config, strapi, routeCollector, contextFactory);
    return generator.generate();
};

export { generate };
//# sourceMappingURL=exports.mjs.map
