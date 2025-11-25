import REPL from 'repl';
import { createCommand } from 'commander';
import { compileStrapi, createStrapi } from '@strapi/core';
import { runAction } from '../utils/helpers.mjs';

const action = async ()=>{
    const appContext = await compileStrapi();
    const app = await createStrapi(appContext).load();
    app.start().then(()=>{
        const repl = REPL.start(app.config.info.name + ' > ' || 'strapi > '); // eslint-disable-line prefer-template
        repl.on('exit', (err)=>{
            if (err) {
                app.log.error(err);
                process.exit(1);
            }
            app.server.destroy();
            process.exit(0);
        });
    });
};
/**
 * `$ strapi console`
 */ const command = ()=>{
    return createCommand('console').description('Open the Strapi framework console').action(runAction('console', action));
};

export { action, command };
//# sourceMappingURL=console.mjs.map
