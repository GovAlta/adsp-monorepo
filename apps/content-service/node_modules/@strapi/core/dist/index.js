'use strict';

var Strapi = require('./Strapi.js');
require('open');
require('lodash/fp');
require('path');
require('undici');
require('./ee/license.js');
var index = require('./utils/update-notifier/index.js');
require('chalk');
require('cli-table3');
require('@paralleldrive/cuid2');
require('node:assert');
var signals = require('./utils/signals.js');
var resolveWorkingDirs = require('./utils/resolve-working-dirs.js');
var compile = require('./compile.js');
var factories = require('./factories.js');

const createStrapi = (options = {})=>{
    const strapi = new Strapi({
        ...options,
        ...resolveWorkingDirs.resolveWorkingDirectories(options)
    });
    signals.destroyOnSignal(strapi);
    index.createUpdateNotifier(strapi);
    // TODO: deprecate and remove in next major
    global.strapi = strapi;
    return strapi;
};

exports.compileStrapi = compile;
exports.factories = factories;
exports.createStrapi = createStrapi;
//# sourceMappingURL=index.js.map
