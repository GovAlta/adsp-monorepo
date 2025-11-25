import { createCommand } from 'commander';
import { runAction } from '../../utils/helpers.mjs';
import { action } from './generate.mjs';

/**
 * `$ strapi openapi`
 */ const command = ()=>{
    const openapi = createCommand('openapi').description('Manage OpenAPI specifications for your Strapi application');
    // `$ strapi openapi generate [-o, --output <path>]`
    openapi.command('generate').description('Generate an OpenAPI specification for the current Strapi application').option('-o, --output <path>', 'Output file path for the OpenAPI specification').action(runAction('openapi:generate', action));
    return openapi;
};

export { command };
//# sourceMappingURL=index.mjs.map
