import { CurriedFunction1 } from 'lodash';
import * as visitors from './visitors';
import * as validators from './validators';
import { Model, Data } from '../types';
export interface Options {
    auth?: unknown;
}
export interface Validator {
    (schema: Model): CurriedFunction1<Data, Promise<Data>>;
}
export interface ValidateFunc {
    (data: unknown, schema: Model, options?: Options): Promise<void>;
}
interface APIOptions {
    validators?: Validators;
    getModel: (model: string) => Model;
}
export interface Validators {
    input?: Validator[];
}
declare const createAPIValidators: (opts: APIOptions) => {
    input: ValidateFunc;
    query: (query: Record<string, unknown>, schema: Model, { auth }?: Options) => Promise<void>;
    filters: ValidateFunc;
    sort: ValidateFunc;
    fields: ValidateFunc;
    populate: ValidateFunc;
};
export { createAPIValidators, validators, visitors };
export type APIValidators = ReturnType<typeof createAPIValidators>;
//# sourceMappingURL=index.d.ts.map