import { type Prompt } from '@inquirer/type';
type ViewFunction<Value, Config> = (config: Config, done: (value: Value) => void) => string | [string, string | undefined];
/**
 * Expand the top-level keys of a type for better IDE display, without
 * recursing into nested fields (so generic values stay compatible).
 */
type ShallowPrettify<T> = {
    [K in keyof T]: T[K];
} & {};
export declare function createPrompt<Value, Config>(view: ViewFunction<Value, Config>): Prompt<Value, ShallowPrettify<Config> & Config>;
export {};
