/// <reference types="lodash" />
import type { Attribute, AnyAttribute, Model, Data } from './types';
export type VisitorUtils = ReturnType<typeof createVisitorUtils>;
export interface VisitorOptions {
    data: Record<string, unknown>;
    schema: Model;
    key: string;
    value: Data[keyof Data];
    attribute?: AnyAttribute;
    path: Path;
    getModel(uid: string): Model;
    parent?: Parent;
}
export type Visitor = (visitorOptions: VisitorOptions, visitorUtils: VisitorUtils) => void;
export interface Path {
    raw: string | null;
    attribute: string | null;
    rawWithIndices?: string | null;
}
export interface TraverseOptions {
    schema: Model;
    path?: Path;
    parent?: Parent;
    getModel(uid: string): Model;
}
export interface Parent {
    attribute?: Attribute;
    key: string | null;
    path: Path;
    schema: Model;
}
declare const createVisitorUtils: ({ data }: {
    data: Data;
}) => {
    remove(key: string): void;
    set(key: string, value: Data): void;
};
declare const _default: import("lodash").CurriedFunction3<Visitor, TraverseOptions, Data, Promise<Data>>;
export default _default;
//# sourceMappingURL=traverse-entity.d.ts.map