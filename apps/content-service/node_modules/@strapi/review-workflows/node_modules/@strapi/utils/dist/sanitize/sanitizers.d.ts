/// <reference types="lodash" />
import type { Model, Data } from '../types';
import type { Parent } from '../traverse/factory';
interface Context {
    schema: Model;
    getModel: (model: string) => Model;
    parent?: Parent;
}
declare const sanitizePasswords: (ctx: Context) => (entity: Data) => Promise<Data>;
declare const defaultSanitizeOutput: (ctx: Context, entity: Data) => Promise<Data>;
declare const defaultSanitizeFilters: import("lodash").CurriedFunction2<Context, unknown, Promise<unknown>>;
declare const defaultSanitizeSort: import("lodash").CurriedFunction2<Context, unknown, Promise<unknown>>;
declare const defaultSanitizeFields: import("lodash").CurriedFunction2<Context, unknown, Promise<unknown>>;
declare const defaultSanitizePopulate: import("lodash").CurriedFunction2<Context, unknown, Promise<unknown>>;
export { sanitizePasswords, defaultSanitizeOutput, defaultSanitizeFilters, defaultSanitizeSort, defaultSanitizeFields, defaultSanitizePopulate, };
//# sourceMappingURL=sanitizers.d.ts.map