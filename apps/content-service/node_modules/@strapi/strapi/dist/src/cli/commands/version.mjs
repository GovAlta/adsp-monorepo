import { createCommand } from 'commander';
import { version } from '../../../package.json.mjs';

/**
 * `$ strapi version`
 */ const command = ()=>{
    // load the Strapi package.json to get version and other information
    return createCommand('version').description('Output the version of Strapi').action(()=>{
        process.stdout.write(`${version}\n`);
        process.exit(0);
    });
};

export { command };
//# sourceMappingURL=version.mjs.map
