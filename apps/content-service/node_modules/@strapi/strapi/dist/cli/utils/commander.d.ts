/**
 * This file includes hooks to use for commander.hook and argParsers for commander.argParser
 */
import { Command, Option } from 'commander';
/**
 * argParser: Parse a comma-delimited string as an array
 */
declare const parseList: (value: string) => string[];
/**
 * Returns an argParser that returns a list
 */
declare const getParseListWithChoices: (choices: string[], errorMessage?: string) => (value: string) => string[];
/**
 * argParser: Parse a string as an integer
 */
declare const parseInteger: (value: string) => number;
/**
 * argParser: Parse a string as a URL object
 */
declare const parseURL: (value: string) => URL;
/**
 * hook: if encrypt==true and key not provided, prompt for it
 */
declare const promptEncryptionKey: (thisCommand: Command) => Promise<void>;
/**
 * hook: require a confirmation message to be accepted unless forceOption (-f,--force) is used
 */
declare const getCommanderConfirmMessage: (message: string, { failMessage }?: {
    failMessage?: string;
}) => (command: Command) => Promise<void>;
declare const confirmMessage: (message: string, { force }?: {
    force?: boolean;
}) => Promise<any>;
declare const forceOption: Option;
export { getParseListWithChoices, parseList, parseURL, parseInteger, promptEncryptionKey, getCommanderConfirmMessage, confirmMessage, forceOption, };
//# sourceMappingURL=commander.d.ts.map