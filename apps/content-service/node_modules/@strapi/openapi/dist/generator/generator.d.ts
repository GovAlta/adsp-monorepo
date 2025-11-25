import type { Core } from '@strapi/types';
import type { Assembler } from '../assemblers';
import type { DocumentContextFactory } from '../context';
import type { PostProcessor } from '../post-processor';
import type { PreProcessor } from '../pre-processor';
import type { RouteCollector } from '../routes';
import type { GeneratorOptions, GeneratorOutput } from './types';
export interface OpenAPIGeneratorConfig {
    preProcessors?: PreProcessor[];
    assemblers?: Assembler.Document[];
    postProcessors?: PostProcessor[];
}
export declare class OpenAPIGenerator {
    private readonly _assemblers;
    private readonly _preProcessors;
    private readonly _postProcessors;
    private readonly _strapi;
    private readonly _routeCollector;
    private readonly _contextFactory;
    constructor(config: OpenAPIGeneratorConfig, strapi: Core.Strapi, routeCollector: RouteCollector, contextFactory: DocumentContextFactory);
    generate(_options?: GeneratorOptions): GeneratorOutput;
    private _initContext;
    private _bootstrap;
    private _finalize;
    private _preProcess;
    private _assemble;
    private _postProcess;
}
//# sourceMappingURL=generator.d.ts.map