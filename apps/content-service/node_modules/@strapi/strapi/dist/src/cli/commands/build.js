'use strict';

var commander = require('commander');
var build = require('../../node/build.js');
var errors = require('../../node/core/errors.js');

const action = async (options)=>{
    try {
        if (options.bundler === 'webpack') {
            options.logger.warn('[@strapi/strapi]: Using webpack as a bundler is deprecated. You should migrate to vite.');
        }
        await build.build(options);
    } catch (err) {
        errors.handleUnexpectedError(err);
    }
};
/**
 * `$ strapi build`
 */ const command = ({ ctx })=>{
    return commander.createCommand('build').option('--bundler [bundler]', 'Bundler to use (webpack or vite)', 'vite').option('-d, --debug', 'Enable debugging mode with verbose logs', false).option('--minify', 'Minify the output', true).option('--silent', "Don't log anything", false).option('--sourcemap', 'Produce sourcemaps', false).option('--stats', 'Print build statistics to the console', false).description('Build the strapi admin app').action(async (options)=>{
        return action({
            ...options,
            ...ctx
        });
    });
};

exports.command = command;
//# sourceMappingURL=build.js.map
