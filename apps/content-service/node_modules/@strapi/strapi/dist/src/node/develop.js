'use strict';

var tsUtils = require('@strapi/typescript-utils');
var utils = require('@strapi/utils');
var chokidar = require('chokidar');
var fs = require('node:fs/promises');
var path = require('node:path');
var cluster = require('node:cluster');
var core = require('@strapi/core');
var dependencies = require('./core/dependencies.js');
var timer = require('./core/timer.js');
var createBuildContext = require('./create-build-context.js');
var staticFiles = require('./staticFiles.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var tsUtils__namespace = /*#__PURE__*/_interopNamespaceDefault(tsUtils);

// This method removes all non-admin build files from the dist directory
const cleanupDistDirectory = async ({ tsconfig, logger, timer: timer$1 })=>{
    const distDir = tsconfig?.config?.options?.outDir;
    if (!distDir || // we don't have a dist dir
    await fs.access(distDir).then(()=>false).catch(()=>true) // it doesn't exist -- if it does but no access, that will be caught later
    ) {
        return;
    }
    const timerName = `cleaningDist${Date.now()}`;
    timer$1.start(timerName);
    const cleaningSpinner = logger.spinner(`Cleaning dist dir ${distDir}`).start();
    try {
        const dirContent = await fs.readdir(distDir);
        const validFilenames = dirContent// Ignore the admin build folder
        .filter((filename)=>filename !== 'build');
        for (const filename of validFilenames){
            await fs.rm(path.resolve(distDir, filename), {
                recursive: true
            });
        }
    } catch (err) {
        const generatingDuration = timer$1.end(timerName);
        cleaningSpinner.text = `Error cleaning dist dir: ${err} (${timer.prettyTime(generatingDuration)})`;
        cleaningSpinner?.fail();
        return;
    }
    const generatingDuration = timer$1.end(timerName);
    cleaningSpinner.text = `Cleaning dist dir (${timer.prettyTime(generatingDuration)})`;
    cleaningSpinner?.succeed();
};
const develop = async ({ cwd, polling, logger, tsconfig, watchAdmin, ...options })=>{
    const timer$1 = timer.getTimer();
    if (cluster.isPrimary) {
        const { didInstall } = await dependencies.checkRequiredDependencies({
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
            // Build without diagnostics in case schemas have changed
            await cleanupDistDirectory({
                tsconfig,
                logger,
                timer: timer$1
            });
            await tsUtils__namespace.compile(cwd, {
                configOptions: {
                    ignoreDiagnostics: true
                }
            });
        }
        /**
     * IF we're not watching the admin we're going to build it, this makes
     * sure that at least the admin is built for users & they can interact
     * with the application.
     */ if (!watchAdmin) {
            timer$1.start('createBuildContext');
            const contextSpinner = logger.spinner(`Building build context`).start();
            console.log('');
            const ctx = await createBuildContext.createBuildContext({
                cwd,
                logger,
                tsconfig,
                options
            });
            const contextDuration = timer$1.end('createBuildContext');
            contextSpinner.text = `Building build context (${timer.prettyTime(contextDuration)})`;
            contextSpinner.succeed();
            timer$1.start('creatingAdmin');
            const adminSpinner = logger.spinner(`Creating admin`).start();
            await staticFiles.writeStaticClientFiles(ctx);
            if (ctx.bundler === 'webpack') {
                const { build: buildWebpack } = await Promise.resolve().then(function () { return require('./webpack/build.js'); });
                await buildWebpack(ctx);
            } else if (ctx.bundler === 'vite') {
                const { build: buildVite } = await Promise.resolve().then(function () { return require('./vite/build.js'); });
                await buildVite(ctx);
            }
            const adminDuration = timer$1.end('creatingAdmin');
            adminSpinner.text = `Creating admin (${timer.prettyTime(adminDuration)})`;
            adminSpinner.succeed();
        }
        cluster.on('message', async (worker, message)=>{
            switch(message){
                case 'reload':
                    {
                        if (tsconfig?.config) {
                            // Build without diagnostics in case schemas have changed
                            await cleanupDistDirectory({
                                tsconfig,
                                logger,
                                timer: timer$1
                            });
                            await tsUtils__namespace.compile(cwd, {
                                configOptions: {
                                    ignoreDiagnostics: true
                                }
                            });
                        }
                        logger.debug('cluster has the reload message, sending the worker kill message');
                        worker.send('kill');
                        break;
                    }
                case 'killed':
                    {
                        logger.debug('cluster has the killed message, forking the cluster');
                        cluster.fork();
                        break;
                    }
                case 'stop':
                    {
                        process.exit(1);
                        break;
                    }
            }
        });
        cluster.fork();
    }
    if (cluster.isWorker) {
        timer$1.start('loadStrapi');
        const loadStrapiSpinner = logger.spinner(`Loading Strapi`).start();
        const strapi = core.createStrapi({
            appDir: cwd,
            distDir: tsconfig?.config.options.outDir ?? '',
            autoReload: true,
            serveAdminPanel: !watchAdmin
        });
        /**
     * If we're watching the admin panel then we're going to attach the watcher
     * as a strapi middleware.
     */ let bundleWatcher;
        const strapiInstance = await strapi.load();
        if (watchAdmin) {
            timer$1.start('createBuildContext');
            const contextSpinner = logger.spinner(`Building build context`).start();
            console.log('');
            const ctx = await createBuildContext.createBuildContext({
                cwd,
                logger,
                strapi,
                tsconfig,
                options
            });
            const contextDuration = timer$1.end('createBuildContext');
            contextSpinner.text = `Building build context (${timer.prettyTime(contextDuration)})`;
            contextSpinner.succeed();
            timer$1.start('creatingAdmin');
            const adminSpinner = logger.spinner(`Creating admin`).start();
            await staticFiles.writeStaticClientFiles(ctx);
            if (ctx.bundler === 'webpack') {
                const { watch: watchWebpack } = await Promise.resolve().then(function () { return require('./webpack/watch.js'); });
                bundleWatcher = await watchWebpack(ctx);
            } else if (ctx.bundler === 'vite') {
                const { watch: watchVite } = await Promise.resolve().then(function () { return require('./vite/watch.js'); });
                bundleWatcher = await watchVite(ctx);
            }
            const adminDuration = timer$1.end('creatingAdmin');
            adminSpinner.text = `Creating admin (${timer.prettyTime(adminDuration)})`;
            adminSpinner.succeed();
        }
        const loadStrapiDuration = timer$1.end('loadStrapi');
        loadStrapiSpinner.text = `Loading Strapi (${timer.prettyTime(loadStrapiDuration)})`;
        loadStrapiSpinner.succeed();
        // For TS projects, type generation is a requirement for the develop command so that the server can restart
        // For JS projects, we respect the experimental autogenerate setting
        if (tsconfig?.config || strapi.config.get('typescript.autogenerate') !== false) {
            timer$1.start('generatingTS');
            const generatingTsSpinner = logger.spinner(`Generating types`).start();
            await tsUtils__namespace.generators.generate({
                strapi: strapiInstance,
                pwd: cwd,
                rootDir: undefined,
                logger: {
                    silent: true,
                    debug: false
                },
                artifacts: {
                    contentTypes: true,
                    components: true
                }
            });
            const generatingDuration = timer$1.end('generatingTS');
            generatingTsSpinner.text = `Generating types (${timer.prettyTime(generatingDuration)})`;
            generatingTsSpinner.succeed();
        }
        if (tsconfig?.config) {
            timer$1.start('compilingTS');
            const compilingTsSpinner = logger.spinner(`Compiling TS`).start();
            await cleanupDistDirectory({
                tsconfig,
                logger,
                timer: timer$1
            });
            await tsUtils__namespace.compile(cwd, {
                configOptions: {
                    ignoreDiagnostics: false
                }
            });
            const compilingDuration = timer$1.end('compilingTS');
            compilingTsSpinner.text = `Compiling TS (${timer.prettyTime(compilingDuration)})`;
            compilingTsSpinner.succeed();
        }
        const restart = async ()=>{
            if (strapiInstance.reload.isWatching && !strapiInstance.reload.isReloading) {
                strapiInstance.reload.isReloading = true;
                strapiInstance.reload();
            }
        };
        const watcher = chokidar.watch(cwd, {
            ignoreInitial: true,
            usePolling: polling,
            ignored: [
                /(^|[/\\])\../,
                /tmp/,
                '**/src/admin/**',
                '**/src/plugins/**/admin/**',
                '**/dist/src/plugins/test/admin/**',
                '**/documentation',
                '**/documentation/**',
                '**/node_modules',
                '**/node_modules/**',
                '**/plugins.json',
                '**/build',
                '**/build/**',
                '**/log',
                '**/log/**',
                '**/logs',
                '**/logs/**',
                '**/*.log',
                '**/index.html',
                '**/public',
                '**/public/**',
                strapiInstance.dirs.static.public,
                utils.strings.joinBy('/', strapiInstance.dirs.static.public, '**'),
                '**/*.db*',
                '**/exports/**',
                '**/dist/**',
                '**/*.d.ts',
                '**/.yalc/**',
                '**/yalc.lock',
                // TODO v6: watch only src folder by default, and flip this to watchIncludeFiles
                ...strapiInstance.config.get('admin.watchIgnoreFiles', [])
            ]
        }).on('add', (path)=>{
            strapiInstance.log.info(`File created: ${path}`);
            restart();
        }).on('change', (path)=>{
            strapiInstance.log.info(`File changed: ${path}`);
            restart();
        }).on('unlink', (path)=>{
            strapiInstance.log.info(`File deleted: ${path}`);
            restart();
        });
        process.on('message', async (message)=>{
            switch(message){
                case 'kill':
                    {
                        logger.debug('child process has the kill message, destroying the strapi instance and sending the killed process message');
                        await watcher.close();
                        await strapiInstance.destroy();
                        if (bundleWatcher) {
                            bundleWatcher.close();
                        }
                        process.send?.('killed');
                        break;
                    }
            }
        });
        strapiInstance.start();
    }
};

exports.develop = develop;
//# sourceMappingURL=develop.js.map
