import { CurriedFunction1 } from 'lodash';
import * as visitors from './visitors';
import * as sanitizers from './sanitizers';
import type { Model, Data } from '../types';
export interface Options {
    auth?: unknown;
}
export interface Sanitizer {
    (schema: Model): CurriedFunction1<Data, Promise<Data>>;
}
export interface SanitizeFunc {
    (data: unknown, schema: Model, options?: Options): Promise<unknown>;
}
export interface APIOptions {
    sanitizers?: Sanitizers;
    getModel: (model: string) => Model;
}
export interface Sanitizers {
    input?: Sanitizer[];
    output?: Sanitizer[];
}
declare const createAPISanitizers: (opts: APIOptions) => {
    input: SanitizeFunc;
    output: SanitizeFunc;
    query: (query: Record<string, unknown>, schema: Model, { auth }?: Options) => Promise<Record<string, unknown>>;
    filters: SanitizeFunc;
    sort: SanitizeFunc;
    fields: SanitizeFunc;
    populate: SanitizeFunc;
};
export { createAPISanitizers, sanitizers, visitors };
export type APISanitiers = ReturnType<typeof createAPISanitizers>;
//# sourceMappingURL=index.d.ts.map