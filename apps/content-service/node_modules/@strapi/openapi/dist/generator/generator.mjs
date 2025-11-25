import { createDebugger } from '../utils/debug.mjs';
import 'node:crypto';
import 'zod/v4';

const debug = createDebugger('generator');
class OpenAPIGenerator {
    generate(_options) {
        debug('generating a new OpenAPI document with the following options: %O', _options);
        const context = this._initContext(this._strapi);
        this// Init timers
        ._bootstrap(context)// Run registered pre-processors
        ._preProcess(context)// Run registered section assemblers
        ._assemble(context)// Run registered post-processors
        ._postProcess(context)// Clean up and set necessary properties
        ._finalize(context);
        const { data, stats } = context.output;
        return {
            document: data,
            durationMs: stats.time.elapsedTime
        };
    }
    _initContext(strapi) {
        debug('collecting registered routes...');
        const routes = this._routeCollector.collect();
        debug('creating the initial document generation context...');
        return this._contextFactory.create({
            strapi,
            routes
        });
    }
    _bootstrap(context) {
        const { timer } = context;
        timer.reset();
        const startedAt = timer.start();
        debug('started generation: %o', new Date(startedAt).toISOString());
        return this;
    }
    _finalize(context) {
        const { timer, output } = context;
        output.stats.time = timer.stop();
        const { endTime, elapsedTime } = output.stats.time;
        debug('completed generation: %O (elapsed: %Oms)', new Date(endTime).toISOString(), elapsedTime);
        return this;
    }
    _preProcess(context) {
        for (const preProcessor of this._preProcessors){
            debug('running pre-processor: %s...', preProcessor.constructor.name);
            preProcessor.preProcess(context);
        }
        return this;
    }
    _assemble(context) {
        for (const assembler of this._assemblers){
            debug('running assembler: %s...', assembler.constructor.name);
            assembler.assemble(context);
        }
        return this;
    }
    _postProcess(context) {
        for (const postProcessor of this._postProcessors){
            debug('running post-processor: %s...', postProcessor.constructor.name);
            postProcessor.postProcess(context);
        }
        return this;
    }
    constructor(// Config
    config, // Dependencies
    strapi, routeCollector, // Factories
    contextFactory){
        // Config
        this._assemblers = config.assemblers ?? [];
        this._preProcessors = config.preProcessors ?? [];
        this._postProcessors = config.postProcessors ?? [];
        // Dependencies
        this._strapi = strapi;
        this._routeCollector = routeCollector;
        // Factories
        this._contextFactory = contextFactory;
    }
}

export { OpenAPIGenerator };
//# sourceMappingURL=generator.mjs.map
