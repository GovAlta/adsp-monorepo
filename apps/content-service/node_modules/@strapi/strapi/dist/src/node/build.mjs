import * as tsUtils from '@strapi/typescript-utils';
import { checkRequiredDependencies } from './core/dependencies.mjs';
import { prettyTime, getTimer } from './core/timer.mjs';
import { createBuildContext } from './create-build-context.mjs';
import { writeStaticClientFiles } from './staticFiles.mjs';

/**
 * @example `$ strapi build`
 *
 * @description Builds the admin panel of the strapi application.
 */ const build = async ({ logger, cwd, tsconfig, ...options })=>{
    const timer = getTimer();
    const { didInstall } = await checkRequiredDependencies({
        cwd,
        logger
    }).catch((err)=>{
        logger.error(err.message);
        process.exit(1);
    });
    if (didInstall) {
        return;
    }
    if (tsconfig?.config) {
        timer.start('compilingTS');
        const compilingTsSpinner = logger.spinner(`Compiling TS`).start();
        tsUtils.compile(cwd, {
            configOptions: {
                ignoreDiagnostics: false
            }
        });
        const compilingDuration = timer.end('compilingTS');
        compilingTsSpinner.text = `Compiling TS (${prettyTime(compilingDuration)})`;
        compilingTsSpinner.succeed();
    }
    timer.start('createBuildContext');
    const contextSpinner = logger.spinner(`Building build context`).start();
    console.log('');
    const ctx = await createBuildContext({
        cwd,
        logger,
        tsconfig,
        options
    });
    const contextDuration = timer.end('createBuildContext');
    contextSpinner.text = `Building build context (${prettyTime(contextDuration)})`;
    contextSpinner.succeed();
    timer.start('buildAdmin');
    const buildingSpinner = logger.spinner(`Building admin panel`).start();
    console.log('');
    try {
        await writeStaticClientFiles(ctx);
        if (ctx.bundler === 'webpack') {
            const { build: buildWebpack } = await import('./webpack/build.mjs');
            await buildWebpack(ctx);
        } else if (ctx.bundler === 'vite') {
            const { build: buildVite } = await import('./vite/build.mjs');
            await buildVite(ctx);
        }
        const buildDuration = timer.end('buildAdmin');
        buildingSpinner.text = `Building admin panel (${prettyTime(buildDuration)})`;
        buildingSpinner.succeed();
    } catch (err) {
        buildingSpinner.fail();
        throw err;
    }
};

export { build };
//# sourceMappingURL=build.mjs.map
