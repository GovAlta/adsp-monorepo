'use strict';

var chalk = require('chalk');
var stringify = require('fast-safe-stringify');
var ora = require('ora');
var cliProgress = require('cli-progress');

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

var cliProgress__namespace = /*#__PURE__*/_interopNamespaceDefault(cliProgress);

const stringifyArg = (arg)=>{
    return typeof arg === 'object' ? stringify(arg) : arg;
};
const createLogger = (options = {})=>{
    const { silent = false, debug = false, timestamp = true } = options;
    const state = {
        errors: 0,
        warning: 0
    };
    return {
        get warnings () {
            return state.warning;
        },
        get errors () {
            return state.errors;
        },
        async debug (...args) {
            if (silent || !debug) {
                return;
            }
            console.log(chalk.cyan(`[DEBUG]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args.map(stringifyArg));
        },
        info (...args) {
            if (silent) {
                return;
            }
            console.info(chalk.blue(`[INFO]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args.map(stringifyArg));
        },
        log (...args) {
            if (silent) {
                return;
            }
            console.info(chalk.blue(`${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args.map(stringifyArg));
        },
        success (...args) {
            if (silent) {
                return;
            }
            console.info(chalk.green(`[SUCCESS]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args.map(stringifyArg));
        },
        warn (...args) {
            state.warning += 1;
            if (silent) {
                return;
            }
            console.warn(chalk.yellow(`[WARN]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args.map(stringifyArg));
        },
        error (...args) {
            state.errors += 1;
            if (silent) {
                return;
            }
            console.error(chalk.red(`[ERROR]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args.map(stringifyArg));
        },
        // @ts-expect-error – returning a subpart of ora is fine because the types tell us what is what.
        spinner (text) {
            if (silent) {
                return {
                    succeed () {
                        return this;
                    },
                    fail () {
                        return this;
                    },
                    start () {
                        return this;
                    },
                    text: '',
                    isSpinning: false
                };
            }
            return ora(text);
        },
        progressBar (totalSize, text) {
            if (silent) {
                return {
                    start () {
                        return this;
                    },
                    stop () {
                        return this;
                    },
                    update () {
                        return this;
                    }
                };
            }
            const progressBar = new cliProgress__namespace.SingleBar({
                format: `${text ? `${text} |` : ''}${chalk.green('{bar}')}| {percentage}%`,
                barCompleteChar: '\u2588',
                barIncompleteChar: '\u2591',
                hideCursor: true,
                forceRedraw: true
            });
            progressBar.start(totalSize, 0);
            return progressBar;
        }
    };
};

exports.createLogger = createLogger;
//# sourceMappingURL=logger.js.map
