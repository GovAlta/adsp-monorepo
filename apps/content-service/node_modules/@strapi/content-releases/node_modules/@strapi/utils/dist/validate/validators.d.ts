import type { Model } from '../types';
import type { Parent, Path } from '../traverse/factory';
interface Context {
    schema: Model;
    getModel: (model: string) => Model;
}
interface PopulateContext extends Context {
    path?: Path;
    parent?: Parent;
}
export declare const FILTER_TRAVERSALS: string[];
export declare const validateFilters: (ctx?: Context | undefined, filters?: unknown, include?: string[] | undefined) => any;
export declare const defaultValidateFilters: (ctx?: Context | undefined, filters?: unknown) => any;
export declare const SORT_TRAVERSALS: string[];
export declare const validateSort: (ctx?: Context | undefined, sort?: unknown, include?: string[] | undefined) => any;
export declare const defaultValidateSort: (ctx?: Context | undefined, sort?: unknown) => any;
export declare const FIELDS_TRAVERSALS: string[];
export declare const validateFields: (ctx?: Context | undefined, fields?: unknown, include?: string[] | undefined) => any;
export declare const defaultValidateFields: (ctx?: Context | undefined, fields?: unknown) => any;
export declare const POPULATE_TRAVERSALS: string[];
export declare const validatePopulate: (ctx?: PopulateContext | undefined, populate?: unknown, includes?: {
    fields?: string[] | undefined;
    sort?: string[] | undefined;
    filters?: string[] | undefined;
    populate?: string[] | undefined;
} | undefined) => any;
export declare const defaultValidatePopulate: (ctx?: Context | undefined, populate?: unknown) => any;
export {};
//# sourceMappingURL=validators.d.ts.map