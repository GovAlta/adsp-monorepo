'use strict';

var tsUtils = require('@strapi/typescript-utils');
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

/**
 * @example `$ strapi build`
 *
 * @description Builds the admin panel of the strapi application.
 */ const build = async ({ logger, cwd, tsconfig, ...options })=>{
    const timer$1 = timer.getTimer();
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
        timer$1.start('compilingTS');
        const compilingTsSpinner = logger.spinner(`Compiling TS`).start();
        tsUtils__namespace.compile(cwd, {
            configOptions: {
                ignoreDiagnostics: false
            }
        });
        const compilingDuration = timer$1.end('compilingTS');
        compilingTsSpinner.text = `Compiling TS (${timer.prettyTime(compilingDuration)})`;
        compilingTsSpinner.succeed();
    }
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
    timer$1.start('buildAdmin');
    const buildingSpinner = logger.spinner(`Building admin panel`).start();
    console.log('');
    try {
        await staticFiles.writeStaticClientFiles(ctx);
        if (ctx.bundler === 'webpack') {
            const { build: buildWebpack } = await Promise.resolve().then(function () { return require('./webpack/build.js'); });
            await buildWebpack(ctx);
        } else if (ctx.bundler === 'vite') {
            const { build: buildVite } = await Promise.resolve().then(function () { return require('./vite/build.js'); });
            await buildVite(ctx);
        }
        const buildDuration = timer$1.end('buildAdmin');
        buildingSpinner.text = `Building admin panel (${timer.prettyTime(buildDuration)})`;
        buildingSpinner.succeed();
    } catch (err) {
        buildingSpinner.fail();
        throw err;
    }
};

exports.build = build;
//# sourceMappingURL=build.js.map
