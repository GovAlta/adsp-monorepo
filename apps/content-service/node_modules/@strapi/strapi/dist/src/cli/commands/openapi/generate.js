'use strict';

var core = require('@strapi/core');
var openapi = require('@strapi/openapi');
var chalk = require('chalk');
var fse = require('fs-extra');
var path = require('path');

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

var openapi__namespace = /*#__PURE__*/_interopNamespaceDefault(openapi);

const DEFAULT_OUTPUT = path.join(process.cwd(), 'specification.json');
const EXPERIMENTAL_MSG = chalk.yellow(`
⚠️  The OpenAPI generation feature is currently experimental.
    Its behavior and output might change in future releases without following semver.
    Please report any issues you encounter on https://github.com/strapi/strapi/issues/new?template=BUG_REPORT.yml.
`);
/**
 * @experimental
 */ const action = async (options)=>{
    console.warn(EXPERIMENTAL_MSG);
    const filePath = options.output ?? DEFAULT_OUTPUT;
    const app = await createStrapiApp();
    const { document, durationMs } = openapi__namespace.generate(app, {
        type: 'content-api'
    });
    writeDocumentToFile(document, filePath);
    summarize(app, durationMs, filePath);
    await teardownStrapiApp(app);
};
const createStrapiApp = async ()=>{
    const appContext = await core.compileStrapi();
    const app = core.createStrapi(appContext);
    // Make sure to not log Strapi debug info
    app.log.level = 'error';
    // Load internals
    await app.load();
    // Make sure the routes are mounted before generating the specification
    app.server.mount();
    return app;
};
const writeDocumentToFile = (document, filePath)=>{
    fse.outputFileSync(filePath, JSON.stringify(document, null, 2));
};
const teardownStrapiApp = async (app)=>{
    await app.destroy();
};
const summarize = (app, durationMs, filePath)=>{
    const cwd = process.cwd();
    const relativeFilePath = path.relative(cwd, filePath);
    const { name, version } = app.config.get('info');
    const fName = chalk.cyan(name);
    const fVersion = chalk.cyan(`v${version}`);
    const fFile = chalk.magenta(relativeFilePath);
    const fTime = chalk.green(`${durationMs}ms`);
    console.log(chalk.bold(`Generated an OpenAPI specification for "${fName} ${fVersion}" at ${fFile} in ${fTime}`));
};

exports.action = action;
//# sourceMappingURL=generate.js.map
