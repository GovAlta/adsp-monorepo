/// <reference types="node" />
import type { Command } from 'commander';
/**
 * Convert bytes to a human readable formatted string, for example "1024" becomes "1KB"
 */
declare const readableBytes: (bytes: number, decimals?: number, padStart?: number) => string;
interface ExitWithOptions {
    logger?: Console;
    prc?: NodeJS.Process;
}
/**
 *
 * Display message(s) to console and then call process.exit with code.
 * If code is zero, console.log and green text is used for messages, otherwise console.error and red text.
 *
 */
declare const exitWith: (code: number, message?: string | string[], options?: ExitWithOptions) => void;
/**
 * assert that a URL object has a protocol value
 *
 */
declare const assertUrlHasProtocol: (url: URL, protocol?: string | string[]) => void;
type ConditionCallback = (opts: Record<string, any>) => Promise<boolean>;
type IsMetCallback = (command: Command) => Promise<void>;
type IsNotMetCallback = (command: Command) => Promise<void>;
/**
 * Passes commander options to conditionCallback(). If it returns true, call isMetCallback otherwise call isNotMetCallback
 */
declare const ifOptions: (conditionCallback: ConditionCallback, isMetCallback?: IsMetCallback, isNotMetCallback?: IsNotMetCallback) => (command: Command) => Promise<void>;
declare const assertCwdContainsStrapiProject: (name: string) => void;
declare const runAction: (name: string, action: (...args: any[]) => Promise<void>) => (...args: unknown[]) => void;
/**
 * @description Notify users this is an experimental command and get them to approve first
 * this can be opted out by passing `yes` as a property of the args object.
 *
 * @example
 * ```ts
 * const { notifyExperimentalCommand } = require('../utils/helpers');
 *
 * const myCommand = async ({ force }) => {
 *  await notifyExperimentalCommand('plugin:build', { force });
 * }
 * ```
 */
declare const notifyExperimentalCommand: (name: string, { force }?: {
    force?: boolean;
}) => Promise<void>;
export { exitWith, assertUrlHasProtocol, ifOptions, readableBytes, runAction, assertCwdContainsStrapiProject, notifyExperimentalCommand, };
//# sourceMappingURL=helpers.d.ts.map