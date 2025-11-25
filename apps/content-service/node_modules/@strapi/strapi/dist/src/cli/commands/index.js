'use strict';

var cloudCli = require('@strapi/cloud-cli');
var createUser = require('./admin/create-user.js');
var resetUserPassword = require('./admin/reset-user-password.js');
var list = require('./components/list.js');
var dump = require('./configuration/dump.js');
var restore = require('./configuration/restore.js');
var list$1 = require('./content-types/list.js');
var list$2 = require('./controllers/list.js');
var list$3 = require('./hooks/list.js');
var list$4 = require('./middlewares/list.js');
var list$5 = require('./policies/list.js');
var list$6 = require('./routes/list.js');
var list$7 = require('./services/list.js');
var disable = require('./telemetry/disable.js');
var enable = require('./telemetry/enable.js');
var generate$1 = require('./templates/generate.js');
var generateTypes = require('./ts/generate-types.js');
var build = require('./build.js');
var console = require('./console.js');
var develop = require('./develop.js');
var generate = require('./generate.js');
var report = require('./report.js');
var start = require('./start.js');
var version = require('./version.js');
var index = require('./openapi/index.js');
var command = require('./export/command.js');
var command$1 = require('./import/command.js');
var command$2 = require('./transfer/command.js');

const commands = [
    createUser.command,
    resetUserPassword.command,
    list.command,
    dump.command,
    restore.command,
    console.command,
    list$1.command,
    list$2.command,
    generate.command,
    list$3.command,
    list$4.command,
    list$5.command,
    report.command,
    list$6.command,
    list$7.command,
    start.command,
    disable.command,
    enable.command,
    generate$1.command,
    generateTypes.command,
    version.command,
    build.command,
    develop.command,
    command,
    command$1,
    command$2,
    index.command,
    /**
   * Cloud
   */ cloudCli.buildStrapiCloudCommands
];

exports.commands = commands;
//# sourceMappingURL=index.js.map
