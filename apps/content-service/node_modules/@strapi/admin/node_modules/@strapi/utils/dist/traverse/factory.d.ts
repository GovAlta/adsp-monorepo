import { AnyAttribute, Attribute, ComponentAttribute, DynamicZoneAttribute, Model, RelationalAttribute } from '../types';
export interface Path {
    raw: string | null;
    attribute: string | null;
}
export interface Parent {
    attribute?: Attribute;
    key: string | null;
    path: Path;
    schema: Model;
}
export interface TraverseOptions {
    schema: Model;
    path?: Path;
    parent?: Parent;
    getModel(uid: string): Model;
}
export interface VisitorOptions {
    data: unknown;
    value: unknown;
    schema: Model;
    key: string;
    attribute?: AnyAttribute;
    path: Path;
    parent?: Parent;
    getModel(uid: string): Model;
}
export type Traverse = (visitor: Visitor, options: TraverseOptions, data: unknown) => Promise<unknown>;
export interface Visitor {
    (visitorOptions: VisitorOptions, opts: Pick<TransformUtils, 'set' | 'remove'>): void;
}
interface Interceptor<T = unknown> {
    predicate(data: unknown): data is T;
    handler(visitor: Visitor, options: TraverseOptions, data: T, recurseOptions: {
        recurse: Traverse;
    }): void;
}
interface ParseUtils<T> {
    transform(data: T): unknown;
    remove(key: string, data: T): unknown;
    set(key: string, value: unknown, data: T): unknown;
    keys(data: T): string[];
    get(key: string, data: T): unknown;
}
interface Parser<T = unknown> {
    predicate(data: unknown): data is T;
    parser(data: T): ParseUtils<T>;
}
interface Ignore {
    (ctx: Context): boolean;
}
interface AttributeHandler<AttributeType = Attribute> {
    predicate(ctx: Context<AttributeType>): boolean;
    handler(ctx: Context<AttributeType>, opts: Pick<TransformUtils, 'set' | 'recurse'>): void;
}
interface CommonHandler<AttributeType = Attribute> {
    predicate(ctx: Context<AttributeType>): boolean;
    handler(ctx: Context<AttributeType>, opts: Pick<TransformUtils, 'set' | 'recurse'>): void;
}
export interface TransformUtils {
    remove(key: string): void;
    set(key: string, value: unknown): void;
    recurse: Traverse;
}
interface Context<AttributeType = Attribute> {
    key: string;
    value: unknown;
    attribute: AttributeType;
    schema: Model;
    path: Path;
    data: unknown;
    visitor: Visitor;
    parent?: Parent;
    getModel(uid: string): Model;
}
declare const _default: () => {
    traverse: Traverse;
    intercept<T>(predicate: Interceptor<T>['predicate'], handler: Interceptor<T>['handler']): any;
    parse<T_1>(predicate: (data: unknown) => data is T_1, parser: (data: T_1) => ParseUtils<T_1>): any;
    ignore(predicate: Ignore): any;
    on(predicate: CommonHandler['predicate'], handler: CommonHandler['handler']): any;
    onAttribute(predicate: AttributeHandler['predicate'], handler: AttributeHandler['handler']): any;
    onRelation(handler: AttributeHandler<RelationalAttribute>['handler']): any;
    onMedia(handler: AttributeHandler<RelationalAttribute>['handler']): any;
    onComponent(handler: AttributeHandler<ComponentAttribute>['handler']): any;
    onDynamicZone(handler: AttributeHandler<DynamicZoneAttribute>['handler']): any;
};
export default _default;
//# sourceMappingURL=factory.d.ts.map