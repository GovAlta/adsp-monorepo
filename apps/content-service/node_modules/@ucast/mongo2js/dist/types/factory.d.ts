import { ParsingInstruction, Condition } from '@ucast/core';
import { MongoQuery, MongoQueryFieldOperators } from '@ucast/mongo';
import { JsInterpreter, JsInterpretationOptions } from '@ucast/js';
declare type ThingFilter<T> = {
    (object: T): boolean;
    ast: Condition;
};
export interface FactoryOptions extends JsInterpretationOptions {
    forPrimitives: boolean;
}
export declare type Filter = <T = Record<string, unknown>, Q extends MongoQuery<T> = MongoQuery<T>>(query: Q) => ThingFilter<T>;
export declare type PrimitiveMongoQuery<T> = MongoQueryFieldOperators<T> & Partial<{
    $and: MongoQueryFieldOperators<T>[];
    $or: MongoQueryFieldOperators<T>[];
    $nor: MongoQueryFieldOperators<T>[];
}>;
export declare type PrimitiveFilter = <T, Q extends PrimitiveMongoQuery<T> = PrimitiveMongoQuery<T>>(query: Q) => ThingFilter<T>;
declare type FilterType<T extends {
    forPrimitives?: true;
}> = T['forPrimitives'] extends true ? PrimitiveFilter : Filter;
export declare function createFactory<T extends Record<string, ParsingInstruction<any, any>>, I extends Record<string, JsInterpreter<any>>, P extends {
    forPrimitives?: true;
}>(instructions: T, interpreters: I, options?: Partial<FactoryOptions> & P): FilterType<P>;
export declare const guard: Filter;
export declare const squire: PrimitiveFilter;
export declare const filter: Filter;
export {};
