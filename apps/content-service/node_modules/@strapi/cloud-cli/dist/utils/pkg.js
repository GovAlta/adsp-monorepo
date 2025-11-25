'use strict';

var fse = require('fs-extra');
var os = require('os');
var pkgUp = require('pkg-up');
var yup = require('yup');
require('chalk');

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

var fse__namespace = /*#__PURE__*/_interopNamespaceDefault(fse);
var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

yup__namespace.object({
    name: yup__namespace.string().required(),
    exports: yup__namespace.lazy((value)=>yup__namespace.object(typeof value === 'object' ? Object.entries(value).reduce((acc, [key, value])=>{
            if (typeof value === 'object') {
                acc[key] = yup__namespace.object({
                    types: yup__namespace.string().optional(),
                    source: yup__namespace.string().required(),
                    module: yup__namespace.string().optional(),
                    import: yup__namespace.string().required(),
                    require: yup__namespace.string().required(),
                    default: yup__namespace.string().required()
                }).noUnknown(true);
            } else {
                acc[key] = yup__namespace.string().matches(/^\.\/.*\.json$/).required();
            }
            return acc;
        }, {}) : undefined).optional())
});
/**
 * @description being a task to load the package.json starting from the current working directory
 * using a shallow find for the package.json  and `fs` to read the file. If no package.json is found,
 * the process will throw with an appropriate error message.
 */ const loadPkg = async ({ cwd, logger })=>{
    const pkgPath = await pkgUp({
        cwd
    });
    if (!pkgPath) {
        throw new Error('Could not find a package.json in the current directory');
    }
    const buffer = await fse__namespace.readFile(pkgPath);
    const pkg = JSON.parse(buffer.toString());
    logger.debug('Loaded package.json:', os.EOL, pkg);
    return pkg;
};

exports.loadPkg = loadPkg;
//# sourceMappingURL=pkg.js.map
