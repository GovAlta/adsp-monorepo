import chalk from 'chalk';
import ora from 'ora';
import * as cliProgress from 'cli-progress';

const silentSpinner = {
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
const silentProgressBar = {
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
        debug (...args) {
            if (silent || !debug) {
                return;
            }
            console.log(chalk.cyan(`[DEBUG]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args);
        },
        info (...args) {
            if (silent) {
                return;
            }
            console.info(chalk.blue(`[INFO]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args);
        },
        log (...args) {
            if (silent) {
                return;
            }
            console.info(chalk.blue(`${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args);
        },
        success (...args) {
            if (silent) {
                return;
            }
            console.info(chalk.green(`[SUCCESS]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args);
        },
        warn (...args) {
            state.warning += 1;
            if (silent) {
                return;
            }
            console.warn(chalk.yellow(`[WARN]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args);
        },
        error (...args) {
            state.errors += 1;
            if (silent) {
                return;
            }
            console.error(chalk.red(`[ERROR]${timestamp ? `\t[${new Date().toISOString()}]` : ''}`), ...args);
        },
        spinner (text) {
            if (silent) {
                return silentSpinner;
            }
            return ora(text);
        },
        progressBar (totalSize, text) {
            if (silent) {
                return silentProgressBar;
            }
            const progressBar = new cliProgress.SingleBar({
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

export { createLogger };
//# sourceMappingURL=logger.mjs.map
